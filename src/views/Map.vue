<template>
  <Page
    title="Karta"
    :no-padding="true"
  >
    <div class="map-container">
      <MapComponent
        :markers="mapObjects"
        @marker-clicked="onSelectCheckpoint"
      />
      <div class="overlay-container">
        <div
          v-if="nearbyCheckpointMarkers.length"
          class="task-status"
        >
          <div class="task-message">
            <p>{{ atLocationText }}</p>
            <div>
              <Button
                label="Visa"
                @click="onReopenCheckpoint"
              />
            </div>
          </div>
        </div>

        <div
          v-if="isLoadingMarkers"
          class="task-status"
        >
          <div class="task-icon">
            <Loader size="small" />
          </div>
          <div class="task-message">
            {{ markersStateMessage }}
          </div>
        </div>
        <div v-if="isPositioningFailed">
          <Message
            header="Problem med kartan"
            headerIcon="map-marker-alt"
            :message="positioningStateMessage"
            type="failure"
          >
            <Button
              label="Testa igen"
              :wide="false"
              @click="initLocationListener"
            />
          </Message>
        </div>
        <div
          class="task-status"
          v-if="!isPositioningFailed"
        >
          <div class="task-icon">
            <AccuracyIcon
              :accuracy="accuracyLevel"
              v-if="isPositionAcquired"
            />
            <Loader
              v-if="!isPositionAcquired"
              size="small"
            />
          </div>
          <div class="task-message">
            {{ positioningStateMessage }}
          </div>
        </div>
      </div>
      <Fullscreen
        v-if="isCheckpointSelectorShown"
        @close="onCloseCheckpointSelector"
      >
        <CheckpointSelector
          :markers="nearbyCheckpointMarkers"
          @selected="onSelectCheckpoint"
        />
      </Fullscreen>
      <Fullscreen
        v-if="isCheckpointPreviewShown"
        @close="onCloseCheckpoint"
      >
        <div
          class="preview-container"
          v-if="!selectedCheckpoint.isStation"
        >
          <Message
            header="Du är för långt bort"
            headerIcon="map-marker-alt"
            message="För att se den här uppgiften måste ni tar er till denna plats."
            type="info"
          />
          <Message
            v-if="!!selectedCheckpoint.duelName"
            headerIcon="angle-double-down"
            :header="duelInfoTitle(selectedCheckpoint)"
            :message="duelInfoMessage(selectedCheckpoint)"
            type="info"
          />
        </div>
        <CheckpointStation
          v-if="selectedCheckpoint.isStation"
          :pointsReported="selectedCheckpoint.submitted"
          :locationLabel="selectedCheckpoint.label"
          :ticket="selectedTicket"
        />
      </Fullscreen>
      <Fullscreen
        v-if="isCheckpointShown"
        @close="onCloseCheckpoint"
      >
        <CheckpointQuestion
          v-if="!selectedCheckpoint.isStation"
          :question-id="selectedCheckpoint.id"
          :duel-name="selectedCheckpoint.duelName"
          :read-only="isCheckpointReadOnly"
          @submit-success="onCheckpointSuccess"
          @submit-failure="onCheckpointFailure"
        />
        <CheckpointStation
          v-if="selectedCheckpoint.isStation"
          :pointsReported="selectedCheckpoint.submitted"
          :locationLabel="selectedCheckpoint.label"
          :ticket="selectedTicket"
        />
      </Fullscreen>
    </div>
  </Page>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import Page from '@/components/layout/Page.vue'
import MapComponent, {
  Coord,
  Marker,
  UserPositionMarker,
  CheckpointMarker,
  StartPositionMarker
} from '@/components/common/Map.vue'
import ConfirmationOverlay from '@/components/common/ConfirmationOverlay.vue'
import NotificationOverlay from '@/components/common/NotificationOverlay.vue'
import AccuracyIcon from '@/components/common/AccuracyIcon.vue'
import Button from '@/components/common/Button.vue'
import Fullscreen from '@/components/common/Fullscreen.vue'
import Loader from '@/components/common/Loader.vue'
import Message, { Type as MessageType } from '@/components/common/Message.vue'
import CheckpointSelector from './map/CheckpointSelector.vue'
import CheckpointQuestion from './map/CheckpointQuestion.vue'
import CheckpointStation from './map/CheckpointStation.vue'
import { TicketData } from '@/components/common/Ticket.vue'
import { QuestionDto } from '@/components/common/question/model'
import * as LocationUtils from '@/utils/Location'
import * as Analytics from '@/utils/Analytics'
import * as Api from '@/utils/Api'
import store from '@/store'

const apiHost = process.env.VUE_APP_API_HOST

enum MarkersState {
  NOT_REQUESTED,
  LOADING,
  LOADED,
  FAILED
}

enum PositioningState {
  NOT_REQUESTED,
  LOADING,
  ACQUIRED,
  FAILED
}

enum CheckpointView {
  NONE,
  SELECT,
  SHOW,
  SHOW_PREVIEW,
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
  link_station_id: number;
  // eslint-disable-next-line camelcase
  link_station_ticket: any;
  // eslint-disable-next-line camelcase
  is_done: boolean;
  // eslint-disable-next-line camelcase
  link_duel_group_id: number;
  // eslint-disable-next-line camelcase
  link_duel_group_name: string;
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

// Minimum time to pass between two location measurements (more frequest measurements might be reported to app but will not trigger GUI update):
const IGNORE_LOCATION_UPDATE_TIMEFRAME_MS = 2000
// Minimum distance between two location measurements for GUI to be updated:
const IGNORE_LOCATION_UPDATE_DISTANCE_METERS = 1
// Number of past user locations to render on map:
const MAX_BREADCRUMB_COUNT = 5

const removeUnavailableStationsFilter = (m: Marker): boolean => {
  const showUnavailableStations = store.state.configuration.positioning.showUnavailableStations
  if (showUnavailableStations) {
    return true
  }
  if (m instanceof CheckpointMarker) {
    return !m.isStation || m.submitted || !!m.stationTicket
  } else {
    return true
  }
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
    CheckpointQuestion,
    CheckpointStation,
    CheckpointSelector,
    Loader,
    AccuracyIcon
  }
})
export default class Map extends Vue {
  private markersState: MarkersState = MarkersState.NOT_REQUESTED;
  private markersStateMessage: string = '';
  private positioningState: PositioningState = PositioningState.NOT_REQUESTED;
  private positioningStateMessage: string = 'Startar GPS';

  private geolocationWatchId = 0;
  private checkpointView: CheckpointView = CheckpointView.NONE
  private lastApproxAccuracy = -1;
  private isLowAccuracyAllowed = false;
  private lowAccuracyTimeoutId = 0;
  private staleUserPositionTimeoutId = 0;

  private markers: Marker[] = [];
  private markersPollingTimeoutId = 0
  private nearbyCheckpointMarkers: Marker[] = [];
  private currentPosition: UserPositionMarker = {
    longitude: 0,
    latitude: 0,
    meterAccuracy: -1,
    timestamp: -1
  };

  private userPositions: UserPositionMarker[] = []

  private selectedCheckpoint: CheckpointMarker | null = null;
  private selectedTicket?: TicketData;

  updateMarkersState(newState: MarkersState, newStateMessage: string) {
    this.markersState = newState
    this.markersStateMessage = newStateMessage

    Analytics.logEvent(Analytics.AnalyticsEventType.MAP, 'set', 'markers_state', {
      state: MarkersState[this.markersState],
      message: this.markersStateMessage
    })
  }

  updatePositioningState(newState: PositioningState, newStateMessage: string) {
    this.positioningState = newState
    this.positioningStateMessage = newStateMessage

    Analytics.logEvent(Analytics.AnalyticsEventType.MAP, 'set', 'positioning_state', {
      state: PositioningState[this.positioningState],
      message: this.positioningStateMessage
    })

    if (newState === PositioningState.FAILED) {
      this.nearbyCheckpointMarkers = []
    }
  }

  toAccuracyLevel(value: string): LocationUtils.AccuracyLevel {
    if (value === 'HIGHEST') {
      return LocationUtils.AccuracyLevel.HIGHEST
    } else if (value === 'HIGH') {
      return LocationUtils.AccuracyLevel.HIGH
    } else if (value === 'MEDIUM') {
      return LocationUtils.AccuracyLevel.MEDIUM
    } else if (value === 'LOW') {
      return LocationUtils.AccuracyLevel.LOW
    }
    return LocationUtils.AccuracyLevel.LOW // Fallback
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

  get isCheckpointPreviewShown() {
    return this.checkpointView === CheckpointView.SHOW_PREVIEW
  }

  get curPos(): UserPositionMarker | null {
    return this.userPositions.length ? { ...this.userPositions[this.userPositions.length - 1] } : null
  }

  get isLoadingMarkers() {
    return (
      this.markersState === MarkersState.NOT_REQUESTED ||
      this.markersState === MarkersState.LOADING
    )
  }

  get atLocationText(): string {
    if (this.nearbyCheckpointMarkers.length === 1) {
      return 'Du befinner dig vid en kontroll.'
    } else {
      return `Du befinner dig vid ${this.nearbyCheckpointMarkers.length} kontroller.`
    }
  }

  onSelectCheckpoint(marker: Marker) {
    if (marker instanceof UserPositionMarker) {
      // console.log('User clicked their own position marker.')
    } else if (marker instanceof CheckpointMarker) {
      const isNearbyCheckpoint = this.nearbyCheckpointMarkers
        .filter((activeMarker: Marker) => activeMarker instanceof CheckpointMarker)
        .some((activeMarker: Marker) => (activeMarker as CheckpointMarker).key === marker.key)
      if (!marker.submitted) {
        if (isNearbyCheckpoint) {
          // console.log('User clicked a checkpoint which they have NOT submitted an answer to and which they are currently close to. SHOW CHECKPOINT.')
          this.showCheckpoint(marker, false)
        } else {
          // console.log('User clicked a checkpoint which they have NOT submitted an answer to and which they are currently NOT close to. DO NOTHING.')
          if (marker.isStation) {
            this.showCheckpoint(marker, true)
          } else {
            this.showCheckpointPreview(marker)
          }
        }
      } else {
        if (isNearbyCheckpoint) {
          // console.log('User clicked a checkpoint which they HAVE submitted an answer to and which they are currently close to. SHOW CHECKPOINT.')
          this.showCheckpoint(marker, false)
        } else {
          // console.log('User clicked a checkpoint which they HAVE submitted an answer to and which they are currently NOT close to. SHOW READ-ONLY CHECKPOINT.')
          this.showCheckpoint(marker, true)
        }
      }
    }
  }

  async showCheckpoint(e: CheckpointMarker, readOnly: boolean) {
    Analytics.logEvent(Analytics.AnalyticsEventType.MAP, 'open', 'checkpoint', {
      message: e.label
    })

    this.checkpointView = readOnly ? CheckpointView.SHOW_READONLY : CheckpointView.SHOW
    this.selectedCheckpoint = e
    this.selectedTicket = e.stationTicket
  }

  async showCheckpointPreview(e: CheckpointMarker) {
    Analytics.logEvent(Analytics.AnalyticsEventType.MAP, 'preview', 'checkpoint', {
      message: e.label
    })

    this.checkpointView = CheckpointView.SHOW_PREVIEW
    this.selectedCheckpoint = e
    this.selectedTicket = e.stationTicket
  }

  onCloseCheckpoint() {
    this.checkpointView = CheckpointView.NONE
    this.selectedCheckpoint = null
  }

  onCloseCheckpointSelector() {
    this.checkpointView = CheckpointView.NONE
  }

  onReopenCheckpoint() {
    this.openCheckpointView()
  }

  setCheckpointSubmitted(checkpointId: string) {
    this.markers.forEach((m: Marker) => {
      if (m instanceof CheckpointMarker) {
        if (!m.isStation && m.id === checkpointId) {
          m.submitted = true
        }
      }
    })
    this.markers = [...this.markers]
  }

  onCheckpointSuccess(updatedQuestionData: QuestionDto) {
    this.setCheckpointSubmitted(String(updatedQuestionData.id))
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

  isPositionStale(position: UserPositionMarker): boolean {
    const positionAge = Date.now() - position.timestamp
    return positionAge > this.stalePositionTimeoutMilliseconds
  }

  updateNearbyCheckpointMarkers(markers: Marker[], position: UserPositionMarker) {
    if (this.isPositionStale(position)) {
      this.nearbyCheckpointMarkers = []
      return
    }
    const isPositionAccurate = this.isAccurateEnough(position.meterAccuracy)
    if (!isPositionAccurate) {
      this.nearbyCheckpointMarkers = []
      return
    }
    const wasCloseToCheckpoint = this.nearbyCheckpointMarkers.length > 0
    this.nearbyCheckpointMarkers = markers
      .filter((marker: Marker) => !(marker instanceof StartPositionMarker))
      .filter(removeUnavailableStationsFilter)
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
    const isCloseToCheckpoint = this.nearbyCheckpointMarkers.length > 0
    if (!wasCloseToCheckpoint && isCloseToCheckpoint) {
      // User has walked into a "checkpoint region" (as opposed to walking out of it or walking around inside of it)
      Analytics.logEvent(
        Analytics.AnalyticsEventType.MAP,
        'arrive',
        'checkpoint',
        {
          message: this.nearbyCheckpointMarkers
            .map((marker: Marker) => marker.label)
            .join(', ')
        }
      )
    } else if (wasCloseToCheckpoint && !isCloseToCheckpoint) {
      // User has walked out of a "checkpoint region" (as opposed to walking into it or walking around inside of it).
    }
  }

  openCheckpointView() {
    if (this.nearbyCheckpointMarkers.length === 1) {
      this.onSelectCheckpoint(this.nearbyCheckpointMarkers[0])
    } else {
      this.checkpointView = CheckpointView.SELECT
    }
  }

  @Watch('curPos')
  onPositionChange(newPosition: UserPositionMarker | null) {
    if (newPosition) {
      this.updateNearbyCheckpointMarkers(this.markers, newPosition)
    }
  }

  @Watch('markers')
  onMarkersChange(newMarkers: Marker[]) {
    this.updateNearbyCheckpointMarkers(newMarkers, this.currentPosition)
  }

  get mapObjects(): Marker[] {
    const mapObjects = this.markers.filter(removeUnavailableStationsFilter)
    if (this.currentPosition.meterAccuracy !== -1 && this.isAccurateEnough(this.currentPosition.meterAccuracy)) {
      return mapObjects.concat(this.userPositions)
    } else {
      return [...mapObjects]
    }
  }

  get isMarkerListLoaded() {
    return this.markers.length > 0
  }

  get isPositionAcquired(): boolean {
    return this.positioningState === PositioningState.ACQUIRED
  }

  get isPositioningFailed(): boolean {
    return this.positioningState === PositioningState.FAILED
  }

  get accuracyLevel(): LocationUtils.AccuracyLevel {
    return LocationUtils.getAccuracyLevel(this.currentPosition.meterAccuracy)
  }

  duelInfoTitle(checkpoint: CheckpointMarker) {
    return `Duell ${checkpoint.duelName}`
  }

  duelInfoMessage(checkpoint: CheckpointMarker) {
    return `Här ska ni genomföra duellen ${checkpoint.duelName} tillsammans med (minst) ett annat lag. Stäng denna popup och titta på Dueller-sidan för att se vilka ni ska möta.`
  }

  async loadMarkers() {
    this.updateMarkersState(MarkersState.LOADING, 'Hämtar karta')
    try {
      const resp = await Api.call({
        endpoint: `${apiHost}/wp-json/tuja/v1/map/markers`
      })
      if (resp.status === 200) {
        const markers = resp.payload

        if (markers.length > 0) {
          this.markers = markers.map(
            ({
              type,
              latitude,
              longitude,
              name,
              radius,
              link_form_question_id: questionId,
              link_station_id: stationId,
              link_station_ticket: stationTicket,
              link_duel_group_id: duelGroupId,
              link_duel_group_name: duelGroupName,
              is_done: isDone
            }: ApiMarker): Marker => {
              let marker
              if (type === 'START') {
                marker = new StartPositionMarker()
              } else {
                marker = new CheckpointMarker()
                marker.id = String(questionId || stationId)
                const isStation = stationId > 0
                marker.isStation = isStation
                marker.duelName = duelGroupName
                marker.submitted = isDone
                marker.showAccuracyCircle = store.state.debugSettings.map
                if (isStation && stationTicket) {
                  marker.stationTicket = {
                    key: stationTicket.station.random_id,
                    colour: stationTicket.colour,
                    word: stationTicket.word,
                    stationName: stationTicket.station.name,
                    markerName: String(name),
                    // Technically, the isUsed flag is not the same as the isDone flag since the isDone flag ALSO captures
                    // if points has been awarded without the team actually having a ticket. This shouldn't happen, but it might.
                    isUsed: stationTicket.is_used
                  }
                }
              }
              marker.latitude = latitude
              marker.longitude = longitude
              marker.meterAccuracy = radius
              marker.label = String(name)
              return marker
            }
          )
          Analytics.logEvent(
            Analytics.AnalyticsEventType.MAP,
            'load',
            'markers',
            {
              count: this.markers.length
            }
          )
          this.updateMarkersState(MarkersState.LOADED, 'Vi har hämtat kartmarkörerna.')
        } else {
          this.updateMarkersState(MarkersState.FAILED,
            'Det finns inga kontroller att visa på kartan.'
          )
        }
      } else if (resp.status === 204) {
        this.updateMarkersState(MarkersState.FAILED,
          'Ert lag har inte blivit tilldelad en karta. Kontakta kundtjänst så löser de detta.'
        )
      } else {
        this.updateMarkersState(MarkersState.FAILED, 'Kunde inte läsa in kontroller.')
      }
    } catch (e: any) {
      if (e instanceof Api.NotSignedInError) {
        this.updateMarkersState(MarkersState.FAILED, 'Du är inte inloggad.')
      } else {
        this.updateMarkersState(MarkersState.FAILED, 'Kunde inte läsa in kontroller.')
      }
    }
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

  updateUserPosition({ latitude, longitude }: Coord, meterAccuracy: number) {
    const newCurrentPosition = new UserPositionMarker()
    newCurrentPosition.meterAccuracy = meterAccuracy
    newCurrentPosition.latitude = latitude
    newCurrentPosition.longitude = longitude
    newCurrentPosition.timestamp = Date.now()
    newCurrentPosition.showAccuracyCircle = store.state.debugSettings.map

    this.currentPosition = newCurrentPosition

    this.userPositions.push(newCurrentPosition)
    const userPositionsHistoryLimit = store.state.debugSettings.map ? MAX_BREADCRUMB_COUNT : 1
    if (this.userPositions.length > userPositionsHistoryLimit) {
      this.userPositions.splice(0, this.userPositions.length - userPositionsHistoryLimit)
    }

    this.restartStaleUserPositionTimeout()
  }

  get stalePositionTimeoutMilliseconds() {
    const configuredTimeout = store.state.configuration.positioning.stalePositionTimeout
    const defaultTimeout = parseInt(process.env.VUE_APP_STALE_POSITION_TIMEOUT || '120', 10)
    const stalePositionTimeout = configuredTimeout || defaultTimeout

    return stalePositionTimeout * 1000
  }

  restartStaleUserPositionTimeout() {
    this.stopStaleUserPositionTimer()

    this.staleUserPositionTimeoutId = setTimeout(() => {
      this.updatePositioningState(PositioningState.FAILED, 'Vi är osäkra på var du befinner dig. Din GPS har inte gett oss din position på ett tag.')
    }, this.stalePositionTimeoutMilliseconds)
  }

  stopStaleUserPositionTimer() {
    if (this.staleUserPositionTimeoutId) {
      clearInterval(this.staleUserPositionTimeoutId)
    }
  }

  initLocationListener() {
    if ('geolocation' in navigator) {
      this.updatePositioningState(
        PositioningState.LOADING,
        'Försöker hittar dig på kartan.'
      )
      if (this.geolocationWatchId) {
        navigator.geolocation.clearWatch(this.geolocationWatchId)
      }
      this.stopLowAccuracyTimer()
      this.stopStaleUserPositionTimer()
      this.geolocationWatchId = navigator.geolocation.watchPosition(
        position => {
          const {
            coords: { accuracy, latitude, longitude }
          } = position
          if (this.userPositions.length) {
            const lastLoggedPosition = this.userPositions[this.userPositions.length - 1]
            if (!this.isPositionStale(lastLoggedPosition)
              && lastLoggedPosition.meterAccuracy === accuracy
              && lastLoggedPosition.latitude === latitude
              && lastLoggedPosition.longitude === longitude) {
              console.log('🙈 Ignoring duplicate measurement. Maybe this only happens during debugging?')
              return
            }
            const lastPositionAge = Date.now() - lastLoggedPosition.timestamp
            const isShortlyAfterLastReportedPosition = lastPositionAge < IGNORE_LOCATION_UPDATE_TIMEFRAME_MS
            const distanceTravelled = coordinateDistance(lastLoggedPosition, { longitude, latitude } as Coord)
            const isSmallDistanceTravelled = distanceTravelled < IGNORE_LOCATION_UPDATE_DISTANCE_METERS
            if (isShortlyAfterLastReportedPosition && isSmallDistanceTravelled) {
              console.log('🙈 Ignoring measurement. Too small difference since previous measurement and too close in time.')
              return
            }
          }

          this.updateUserPosition({ latitude, longitude }, accuracy)

          const isPositionAccurate = this.isAccurateEnough(accuracy)
          if (this.positioningState !== PositioningState.ACQUIRED) {
            if (!this.lowAccuracyTimeoutId && !isPositionAccurate) {
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
                this.updateNearbyCheckpointMarkers(this.markers, this.currentPosition)
              }, accuracyTimeout * 1000)
            }
          }

          if (isPositionAccurate && this.lowAccuracyTimeoutId) {
            this.stopLowAccuracyTimer()
          }

          const positioningStatusMessage = isPositionAccurate
            ? 'Bra GPS-mottagning.'
            : (this.isLowAccuracyAllowed
              ? 'Din GPS är inte tillräckligt exakt just nu. Kontakta kundtjänst för att få hjälp.'
              : 'Vi är osäkra på din position. Stå still ett litet tag så löser det sig säkert.')
          this.updatePositioningState(
            PositioningState.ACQUIRED,
            positioningStatusMessage
          )

          this.logAccuracy(accuracy)
        },
        error => {
          switch (error.code) {
            // 1 PERMISSION_DENIED The acquisition of the geolocation information failed because the page didn't have the permission to do it.
            case 1:
              this.updatePositioningState(
                PositioningState.FAILED,
                'Är din GPS påslagen? Har du blockerat den här sidan från att använda den?'
              )
              break
            // 2 POSITION_UNAVAILABLE The acquisition of the geolocation failed because one or several internal sources of position returned an internal error.
            case 2:
              this.updatePositioningState(
                PositioningState.FAILED,
                'Av någon anledning kunde vi inte ta reda på din position.'
              )
              break
            // 3 TIMEOUT The time allowed to acquire the geolocation, defined by PositionOptions.timeout information that was reached before the information was obtained.
            case 3:
              this.updatePositioningState(
                PositioningState.FAILED,
                'Det tog för lång tid att ta reda på din position så vi gav upp.'
              )
              break
            default:
              this.updatePositioningState(
                PositioningState.FAILED,
                'Av någon anledning kunde vi inte ta reda på din position.'
              )
              break
          }
          this.stopLocationListener()
        },
        {
          enableHighAccuracy: true,
          maximumAge: 2000
        }
      )
    } else {
      this.updatePositioningState(PositioningState.FAILED, 'Du saknar GPS.')
    }
  }

  async pollMarkers() {
    await this.loadMarkers()

    const pollInterval = (store.state.configuration.updates.configPollInterval || 60)

    console.log(`Will fetch markers in ${pollInterval} seconds.`)
    this.markersPollingTimeoutId = setTimeout(this.pollMarkers, pollInterval * 1000)
  }

  async initMarkersPolling() {
    await this.pollMarkers()
  }

  async mounted() {
    await this.initMarkersPolling()
    this.initLocationListener()
  }

  stopLowAccuracyTimer() {
    if (this.lowAccuracyTimeoutId) {
      clearTimeout(this.lowAccuracyTimeoutId)
      this.lowAccuracyTimeoutId = 0
    }
  }

  stopLocationListener() {
    if (this.geolocationWatchId) {
      navigator.geolocation.clearWatch(this.geolocationWatchId)
    }
    this.stopLowAccuracyTimer()
    this.stopStaleUserPositionTimer()
  }

  stopMarkersPolling() {
    if (this.markersPollingTimeoutId) {
      clearTimeout(this.markersPollingTimeoutId)
      this.markersPollingTimeoutId = 0
    }
  }

  beforeDestroy() {
    this.stopLocationListener()
    this.stopMarkersPolling()
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

.preview-container {
  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: column;
  align-content: center;
  justify-content: center;
}

.preview-container >>> div.message-container {
  margin: 10px;
}

.arrival-container {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  height: 100%;
  width: 100%;
  align-items: center;
}

.task-status {
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: row;
  border-radius: 10px;
  padding: 10px;
  margin-top: 10px;
}

.task-icon {
  padding: 0 10px 0 0;
}

.task-message p {
  margin: 0 0 10px 0;
}

.overlay-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  z-index: 1000; /* To put it above the map */
  /* text-align: center; */
  position: absolute;
  /* background-color: rgba(255, 255, 255, 0.9); */
  bottom: 20px;
  right: 20px;
  left: 20px;
  /* min-height: 20%; */
  color: #000;
}
</style>
