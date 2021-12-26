<template>
  <Page
    title="Karta"
    :no-padding="!isError"
  >
    <div
      class="no-map"
      v-if="isLoadingMarkers"
    >
      <Loader :message="stateMessage" />
    </div>
    <div
      class="no-map"
      v-if="isError"
    >
      <Message
        header="Problem med kartan"
        :message="stateMessage"
        :type="stateMessageType"
      />
    </div>
    <div
      class="map-container"
      v-if="!isLoadingMarkers && !isError"
    >
      <MapComponent
        :markers="checkpoints"
        @marker-clicked="onSelectCheckpoint"
      />
      <ConfirmationOverlay
        v-if="activeMarkers.length"
        :question="atLocationText"
        @accept="onReopenCheckpoint"
        accept-label="Visa"
      />
      <NotificationOverlay
        v-if="!!notification"
        :message="notification"
      />
      <Fullscreen
        v-if="isCheckpointSelectorShown"
        @close="onCloseCheckpointSelector"
      >
        <CheckpointSelector
          :markers="activeMarkers"
          @selected="onSelectCheckpoint"
        />
      </Fullscreen>
      <Fullscreen
        v-if="isCheckpointShown"
        @close="onCloseCheckpoint"
      >
        <Checkpoint
          :question-id="selectedCheckpointQuestionId"
          :read-only="isCheckpointReadOnly"
          @submit-success="onCheckpointSuccess"
          @submit-failure="onCheckpointFailure"
        />
      </Fullscreen>
    </div>
  </Page>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import Page from '@/components/layout/Page.vue'
import * as AuthUtils from '@/utils/Auth'
import MapComponent, {
  Coord,
  Marker,
  MarkerType
} from '@/components/common/Map.vue'
import ConfirmationOverlay from '@/components/common/ConfirmationOverlay.vue'
import NotificationOverlay from '@/components/common/NotificationOverlay.vue'
import Button from '@/components/common/Button.vue'
import Fullscreen from '@/components/common/Fullscreen.vue'
import Loader from '@/components/common/Loader.vue'
import Message, { Type as MessageType } from '@/components/common/Message.vue'
import CheckpointSelector from './map/CheckpointSelector.vue'
import Checkpoint from './map/Checkpoint.vue'
import * as LocationUtils from '@/utils/Location'
import * as Analytics from '@/utils/Analytics'
import store from '@/store'

const apiHost = process.env.VUE_APP_API_HOST

enum State {
  INITIAL,
  LOADING_MARKERS,
  MARKERS_LOADED,
  LOADING_POSITION,
  POSITION_ACQUIRED,
  ERROR
}

enum CheckpointView {
  NONE,
  SELECT,
  SHOW,
  SHOW_READONLY
}

type ApiMarker = {
  type: string;
  latitude: number;
  longitude: number;
  radius: number;
  name: string;
  // eslint-disable-next-line camelcase
  link_form_question_id: number;
  // eslint-disable-next-line camelcase
  is_response_submitted: boolean;
};

// Credits: https://stackoverflow.com/a/27943
//
// From https://nathanrooy.github.io/posts/2016-09-07/haversine-with-python/:
//   "Much of [this algorithm's] simplicity comes from the underlying assumption that
//   Earth is a perfect sphere (which it isn't...). Because of this, it can lead to
//   errors of up to 0.5%."

const coordinateDistance = (coord1: Coord, coord2: Coord) => {
  const R = 6371 // Radius of the Earth (in km)
  const dLat = deg2rad(coord2.latitude - coord1.latitude)
  const dLon = deg2rad(coord2.longitude - coord1.longitude)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(coord1.latitude)) *
    Math.cos(deg2rad(coord2.latitude)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c * 1000.0 // Distance (in meter)
}

const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180)
}

@Component({
  components: {
    Page,
    MapComponent,
    Message,
    ConfirmationOverlay,
    NotificationOverlay,
    Fullscreen,
    Button,
    Checkpoint,
    CheckpointSelector,
    Loader
  }
})
export default class Map extends Vue {
  private state: State = State.INITIAL;
  private notification = '';
  private stateMessage = '';
  private stateMessageType: MessageType = MessageType.FAILURE;
  private watchId = 0;
  private checkpointView: CheckpointView = CheckpointView.NONE
  private lastApproxAccuracy = -1;
  private isLowAccuracyAllowed = false;
  private lowAccuracyTimeoutId = 0;

  private markers: Marker[] = [];
  private activeMarkers: Marker[] = [];
  private currentPosition: Marker = {
    longitude: 0,
    latitude: 0,
    meterAccuracy: -1,
    type: MarkerType.USER_POSITION,
    id: ''
  };

  private selectedCheckpointQuestionId: string | null = null;

  updateState(newState: State, newStateMessage: string) {
    this.state = newState
    this.stateMessage = newStateMessage

    Analytics.logEvent(Analytics.AnalyticsEventType.MAP, 'set', 'state', {
      state: State[this.state],
      message: this.stateMessage
    })
  }

  get isCheckpointSelectorShown() {
    return this.checkpointView === CheckpointView.SELECT
  }

  get isCheckpointShown() {
    return this.checkpointView === CheckpointView.SHOW || this.isCheckpointReadOnly
  }

  get isCheckpointReadOnly() {
    return this.checkpointView === CheckpointView.SHOW_READONLY
  }

  get curPos() {
    return { ...this.currentPosition }
  }

  get isError() {
    return this.state === State.ERROR
  }

  get isLoadingMarkers() {
    return (
      this.state === State.INITIAL ||
      this.state === State.LOADING_MARKERS
    )
  }

  get atLocationText(): string {
    if (this.activeMarkers.length === 1) {
      return 'Du befinner dig vid en kontroll.'
    } else {
      return `Du befinner dig vid ${this.activeMarkers.length} kontroller.`
    }
  }

  onSelectCheckpoint(marker: Marker) {
    const isActiveMarker = this.activeMarkers.some((activeMarker: Marker) => activeMarker.id === marker.id)
    switch (marker.type) {
      case MarkerType.USER_POSITION:
        // console.log('User clicked their own position marker.')
        break
      case MarkerType.CHECKPOINT:
        if (isActiveMarker) {
          // console.log('User clicked a checkpoint which they have NOT submitted an answer to and which they are currently close to. SHOW CHECKPOINT.')
          this.showCheckpoint(marker, false)
        } else {
          // console.log('User clicked a checkpoint which they have NOT submitted an answer to and which they are currently NOT close to. DO NOTHING.')
        }
        break
      case MarkerType.CHECKPOINT_SUBMITTED:
        if (isActiveMarker) {
          // console.log('User clicked a checkpoint which they HAVE submitted an answer to and which they are currently close to. SHOW CHECKPOINT.')
          this.showCheckpoint(marker, false)
        } else {
          // console.log('User clicked a checkpoint which they HAVE submitted an answer to and which they are currently NOT close to. SHOW READ-ONLY CHECKPOINT.')
          this.showCheckpoint(marker, true)
        }
        break
    }
  }

  async showCheckpoint(e: Marker, readOnly: boolean) {
    Analytics.logEvent(Analytics.AnalyticsEventType.MAP, 'open', 'checkpoint', {
      message: e.label
    })

    this.checkpointView = readOnly ? CheckpointView.SHOW_READONLY : CheckpointView.SHOW
    this.selectedCheckpointQuestionId = e.id
  }

  onCloseCheckpoint() {
    this.checkpointView = CheckpointView.NONE
    this.selectedCheckpointQuestionId = null
  }

  onCloseCheckpointSelector() {
    this.checkpointView = CheckpointView.NONE
  }

  onReopenCheckpoint() {
    this.openCheckpointView()
  }

  onCheckpointSuccess() {
    this.checkpointView = CheckpointView.SHOW
    this.selectedCheckpointQuestionId = null
  }

  onCheckpointFailure(e: any) {
    // TODO: Handle errors
  }

  isAccurateEnough(meterAccuracy: number) {
    const accuracyLevel = LocationUtils.getAccuracyLevel(meterAccuracy)
    const isAccuracyEnough = accuracyLevel === LocationUtils.AccuracyLevel.HIGHEST ||
      (accuracyLevel === LocationUtils.AccuracyLevel.HIGH && this.isLowAccuracyAllowed)
    return isAccuracyEnough
  }

  updateActiveMarkers(markers: Marker[], position: Marker) {
    const isPositionAccurate = this.isAccurateEnough(position.meterAccuracy)
    if (!isPositionAccurate) {
      this.notification = this.isLowAccuracyAllowed
        ? 'Din GPS är inte tillräckligt exakt just nu. Kontakta kundtjänst för att få hjälp.'
        : 'Vi är osäkra på din position. Stå still ett litet tag så löser det sig säkert.'
      this.activeMarkers = []
      return
    }
    this.notification = ''

    const isMarkerActiveBefore = this.activeMarkers.length > 0
    this.activeMarkers = markers
      .filter((marker: Marker) => marker.type !== MarkerType.START)
      .filter((marker: Marker) => {
        const distance = coordinateDistance(
          {
            latitude: position.latitude,
            longitude: position.longitude
          },
          {
            latitude: marker.latitude,
            longitude: marker.longitude
          }
        )
        const marginOfError = (marker.meterAccuracy || 0) + (position.meterAccuracy || 0)
        const isWithinMarker = distance - marginOfError <= 0
        return isWithinMarker
      })
    const isMarkerActiveAfter = this.activeMarkers.length > 0
    if (!isMarkerActiveBefore && isMarkerActiveAfter) {
      // User has walked into a "checkpoint region" (as opposed to walking out of it or walking around inside of it)
      Analytics.logEvent(
        Analytics.AnalyticsEventType.MAP,
        'arrive',
        'checkpoint',
        {
          message: this.activeMarkers
            .map((marker: Marker) => marker.label)
            .join(', ')
        }
      )
    } else if (isMarkerActiveBefore && !isMarkerActiveAfter) {
      // User has walked out of a "checkpoint region" (as opposed to walking into it or walking around inside of it).
    }
  }

  openCheckpointView() {
    if (this.activeMarkers.length === 1) {
      this.onSelectCheckpoint(this.activeMarkers[0])
    } else {
      this.checkpointView = CheckpointView.SELECT
    }
  }

  @Watch('curPos')
  onPositionChange(newPosition: Marker) {
    this.updateActiveMarkers(this.markers, newPosition)
  }

  @Watch('markers')
  onMarkersChange(newMarkers: Marker[]) {
    this.updateActiveMarkers(newMarkers, this.currentPosition)
  }

  get checkpoints(): Marker[] {
    if (this.currentPosition.meterAccuracy !== -1 && this.isAccurateEnough(this.currentPosition.meterAccuracy)) {
      return [...this.markers, this.currentPosition]
    } else {
      return [...this.markers]
    }
  }

  get isMarkerListLoaded() {
    return this.markers.length > 0
  }

  async loadMarkers() {
    const token = AuthUtils.getTokenCookie()
    if (token) {
      this.updateState(State.LOADING_MARKERS, 'Hämtar karta.')
      try {
        const resp = await fetch(
          `${apiHost}/wp-json/tuja/v1/map/markers?token=${token}`
        )

        if (resp.status === 200) {
          const markers = await resp.json()

          if (markers.length > 0) {
            this.markers = markers.map(
              ({
                type,
                latitude,
                longitude,
                name,
                radius,
                link_form_question_id: questionId,
                is_response_submitted: isResponseSubmitted
              }: ApiMarker): Marker => ({
                latitude,
                longitude,
                meterAccuracy: radius,
                label: String(name),
                type: type === 'START' ? MarkerType.START : (isResponseSubmitted ? MarkerType.CHECKPOINT_SUBMITTED : MarkerType.CHECKPOINT),
                id: String(questionId ?? -1)
              })
            )
            Analytics.logEvent(
              Analytics.AnalyticsEventType.MAP,
              'load',
              'markers',
              {
                count: this.markers.length
              }
            )
            this.updateState(State.MARKERS_LOADED, 'Vi har hämtat kartmarkörerna.')
            return true
          } else {
            this.updateState(
              State.ERROR,
              'Det finns inga kontroller att visa på kartan.'
            )
          }
        } else if (resp.status === 204) {
          this.updateState(
            State.ERROR,
            'Ert lag har inte blivit tilldelad en karta. Kontakta kundtjänst så löser de detta.'
          )
        } else {
          this.updateState(State.ERROR, 'Kunde inte läsa in kontroller.')
        }
      } catch (e) {
        this.updateState(State.ERROR, 'Kunde inte läsa in kontroller.')
      }
    } else {
      this.updateState(State.ERROR, 'Du är inte inloggad.')
    }
    return false
  }

  logAccuracy(accuracy: number) {
    // The accuracy often changes by a fraction between measurements.
    // Only consider it "a proper change" if it changes by at least 10 meters.
    const approxAccuracy = Math.round(accuracy / 10) * 10
    const isAccuracyChange = this.lastApproxAccuracy !== approxAccuracy
    Analytics.logEvent(
      Analytics.AnalyticsEventType.MAP,
      'acquire',
      'location',
      {
        accuracy: approxAccuracy
      },
      isAccuracyChange ? Analytics.LogLevel.INFO : Analytics.LogLevel.DEBUG
    )
    this.lastApproxAccuracy = approxAccuracy
  }

  initLocationListener() {
    if ('geolocation' in navigator) {
      this.updateState(
        State.LOADING_POSITION,
        'Försöker hittar dig på kartan.'
      )
      if (this.watchId) {
        navigator.geolocation.clearWatch(this.watchId)
      }
      if (this.lowAccuracyTimeoutId) {
        clearTimeout(this.lowAccuracyTimeoutId)
        this.lowAccuracyTimeoutId = 0
      }
      this.watchId = navigator.geolocation.watchPosition(
        position => {
          const {
            coords: { accuracy, latitude, longitude }
          } = position

          this.currentPosition = {
            meterAccuracy: accuracy,
            latitude: latitude,
            longitude: longitude,
            type: MarkerType.USER_POSITION,
            id: ''
          }
          if (this.state !== State.POSITION_ACQUIRED) {
            this.updateState(
              State.POSITION_ACQUIRED,
              'Vi har hittat dig på kartan.'
            )
            if (!this.lowAccuracyTimeoutId) {
              const configuredTimeout = store.state.configuration.positioning.highAccuracyTimeout
              const defaultTimeout = parseInt(process.env.VUE_APP_HIGH_ACCURACY_TIMEOUT || '60', 10)
              const accuracyTimeout = configuredTimeout || defaultTimeout

              console.log(`Will wait ${accuracyTimeout} seconds before accepting lower accuracy.`)

              this.lowAccuracyTimeoutId = setTimeout(() => {
                Analytics.logEvent(
                  Analytics.AnalyticsEventType.MAP,
                  'lower',
                  'accuracy threshold'
                )
                this.isLowAccuracyAllowed = true
                this.lowAccuracyTimeoutId = 0

                // Check right away (instead of waiting for next coordinate update from browser) if the
                // lowered accuracy requirement means that checkpoints are now close enough to be shown.
                this.updateActiveMarkers(this.markers, this.currentPosition)
              }, accuracyTimeout * 1000)
            }
          }

          this.logAccuracy(accuracy)
        },
        error => {
          switch (error.code) {
            // 1 PERMISSION_DENIED The acquisition of the geolocation information failed because the page didn't have the permission to do it.
            case 1:
              this.updateState(
                State.ERROR,
                'Antingen är din GPS inte påslagen eller så blockerade du den.'
              )
              break
            // 2 POSITION_UNAVAILABLE The acquisition of the geolocation failed because one or several internal sources of position returned an internal error.
            case 2:
              this.updateState(
                State.ERROR,
                'Det gick inte att fixera din position. Kanske åker du bil eller är på en plats med dålig mottagning?'
              )
              break
            // 3 TIMEOUT The time allowed to acquire the geolocation, defined by PositionOptions.timeout information that was reached before the information was obtained.
            case 3:
              this.updateState(
                State.ERROR,
                'Det tog för lång tid att ta reda på din position så vi gav upp.'
              )
              break
            default:
              this.updateState(
                State.ERROR,
                'Av någon anledning kunde vi inte ta reda på din position.'
              )
              break
          }
        }
      )
    } else {
      this.updateState(State.ERROR, 'Du saknar GPS.')
    }
  }

  async mounted() {
    const markersLoaded = await this.loadMarkers()
    if (markersLoaded) {
      this.initLocationListener()
    }
  }

  beforeDestroy() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId)
    }
    if (this.lowAccuracyTimeoutId) {
      clearTimeout(this.lowAccuracyTimeoutId)
      this.lowAccuracyTimeoutId = 0
    }
  }
}
</script>

<style scoped>
.map-container,
.map-container .container {
  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: column;
  align-content: center;
  justify-content: flex-end;
}
.no-map {
  display: flex;
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: center;
}

.arrival-container {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  height: 100%;
  width: 100%;
  align-items: center;
}
</style>
