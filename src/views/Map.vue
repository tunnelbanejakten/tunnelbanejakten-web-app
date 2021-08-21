<template>
  <Page
    title="Karta"
    :no-padding="true"
  >
    <div
      class="no-map"
      v-if="isLoading"
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
      v-if="!isLoading && !isError"
    >
      <MapComponent :markers="checkpoints" />
      <ConfirmationOverlay
        v-if="activeMarkers.length"
        :question="atLocationText"
        @accept="onShowArrivalPopup"
        accept-label="Visa"
      />
      <NotificationOverlay
        v-if="!!notification"
        :message="notification"
      />
      <Fullscreen
        v-if="isCheckpointArrivalShown"
        @close="onCloseArrivalPopup"
      >
        <CheckpointSelector
          :markers="activeMarkers"
          @selected="onSelectCheckpoint"
        />
      </Fullscreen>
      <Fullscreen
        v-if="isCheckpointShown"
        @close="onCloseCheckpointPopup"
      >
        <Checkpoint
          :question-id="questionId"
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

const apiHost = process.env.VUE_APP_API_HOST

const LOW_ACCURACY_TIMEOUT = 60

enum State {
  INITIAL,
  LOADING_MARKERS,
  LOADING_POSITION,
  POSITION_ACQUIRED,
  ERROR
}

type ApiMarker = {
  latitude: number;
  longitude: number;
  radius: number;
  name: string;
  // eslint-disable-next-line camelcase
  link_form_question_id: number;
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
  private isCheckpointArrivalShown = false;
  private isCheckpointShown = false;
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

  private questionId: string | null = null;

  updateState(newState: State, newStateMessage: string) {
    this.state = newState
    this.stateMessage = newStateMessage

    Analytics.logEvent(Analytics.AnalyticsEventType.MAP, 'set', 'state', {
      state: State[this.state],
      message: this.stateMessage
    })
  }

  get curPos() {
    return { ...this.currentPosition }
  }

  get isError() {
    return this.state === State.ERROR
  }

  get isLoading() {
    return (
      this.state === State.INITIAL ||
      this.state === State.LOADING_MARKERS ||
      this.state === State.LOADING_POSITION
    )
  }

  get atLocationText(): string {
    if (this.activeMarkers.length === 1) {
      return 'Du befinner dig vid en kontroll.'
    } else {
      return `Du befinner dig vid ${this.activeMarkers.length} kontroller.`
    }
  }

  async onSelectCheckpoint(e: Marker) {
    Analytics.logEvent(Analytics.AnalyticsEventType.MAP, 'open', 'checkpoint', {
      message: e.label
    })

    this.isCheckpointArrivalShown = false
    this.isCheckpointShown = true
    this.questionId = e.id
  }

  onCloseCheckpointPopup() {
    this.isCheckpointShown = false
    this.questionId = null
  }

  onCloseArrivalPopup() {
    this.isCheckpointArrivalShown = false
  }

  onShowArrivalPopup() {
    this.isCheckpointArrivalShown = true
  }

  onCheckpointSuccess() {
    this.isCheckpointShown = false
    this.questionId = null
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
        ? 'Vi är fortfarande osäkra på din position. Kontakta kundtjänst för att få hjälp.'
        : 'Vi är osäkra på din position. Stå still ett litet tag så löser det sig säkert.'
      return
    }
    this.notification = ''

    const isMarkerActiveBefore = this.activeMarkers.length > 0
    this.activeMarkers = markers.filter((marker: Marker) => {
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
      const marginOfError =
        (marker.meterAccuracy || 0) + (position.meterAccuracy || 0)
      const isWithinMarker = distance - marginOfError <= 0
      return isWithinMarker
    })
    const isMarkerActiveAfter = this.activeMarkers.length > 0
    if (!isMarkerActiveBefore && isMarkerActiveAfter) {
      // User has walked into a "checkpoint region" (as opposed to walking out of it or walking around inside of it)
      this.isCheckpointArrivalShown = true
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

      this.isCheckpointArrivalShown = false
      this.isCheckpointShown = false
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
    return [...this.markers, this.currentPosition]
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
        const markers = await resp.json()

        if (markers.length > 0) {
          this.markers = markers.map(
            ({
              latitude,
              longitude,
              name,
              radius,
              link_form_question_id: questionId
            }: ApiMarker): Marker => ({
              latitude,
              longitude,
              meterAccuracy: radius,
              label: String(name),
              type: MarkerType.CHECKPOINT,
              id: String(questionId)
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
          return true
        } else {
          this.updateState(
            State.ERROR,
            'Det finns inga kontroller att visa på kartan.'
          )
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
    if (isAccuracyChange) {
      Analytics.logEvent(
        Analytics.AnalyticsEventType.MAP,
        'acquire',
        'location',
        {
          accuracy: approxAccuracy
        }
      )
    }
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
              }, LOW_ACCURACY_TIMEOUT * 1000)
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
