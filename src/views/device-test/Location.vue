<template>
  <div>
    <p>
      Vissa uppgifter under tävlingen kräver att ni befinner er på vissa
      platser. Därför behöver vi få tillgång till din GPS.
    </p>
    <Button
      @click="onStartTest"
      size="huge"
      :label="startTestButtonLabel"
      :type="startTestButtonType"
    />
    <Fullscreen
      v-if="isTestStarted"
      @close="onDone"
    >
      <div
        v-if="isPositioningPending"
        class="waiting-container"
      >
        <div>
          {{ geolocationMessage }}
        </div>
      </div>
      <div
        v-if="isPositioningFailed"
        class="waiting-container"
      >
        <div>
          {{ geolocationMessage }}
        </div>
        <div>
          <Button
            label="Ok"
            @click="onDone"
          />
        </div>
      </div>
      <div
        v-if="isPositioningDone"
        class="done-container"
      >
        <Map :markers="[curPos]" />
        <ConfirmationOverlay
          v-if="isAccuratePosition"
          question="Befinner du dig i den gröna cirkeln?"
          accept-label="Ja"
          @accept="onUserAccept"
          reject-label="Nej"
          @reject="onUserReject"
        />
        <ConfirmationOverlay
          v-if="!isAccuratePosition"
          question="Vi försöker ta reda på var du är. Håll ut."
          reject-label="Avbryt"
          @reject="onUserReject"
        />
      </div>
    </Fullscreen>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import Button from '@/components/common/Button.vue'
import Fullscreen from '@/components/common/Fullscreen.vue'
import ConfirmationOverlay from '@/components/common/ConfirmationOverlay.vue'
import Map, { Marker, MarkerType } from '@/components/common/Map.vue'
import store, { Status } from '@/store'
import * as Analytics from '@/utils/Analytics'
import * as LocationUtils from '@/utils/Location'

const GeolocationStatus = {
  UNKNOWN: 'UNKNOWN',
  NO_BROWSER_API: 'NO_BROWSER_API',
  NO_USER_APPROVAL: 'NO_USER_APPROVAL',
  NO_POSITION: 'NO_POSITION',
  NO_RESPONSE: 'NO_RESPONSE',
  BROWSER_API_AVAILABLE: 'BROWSER_API_AVAILABLE',
  LOCATION_REQUEST_INITIATED: 'LOCATION_REQUEST_INITIATED',
  LOCATION_REQUEST_SUCCEEDED: 'LOCATION_REQUEST_SUCCEEDED',
  LOCATION_REQUEST_FAILED: 'LOCATION_REQUEST_FAILED'
}

const LOGGED_STATUS = [
  GeolocationStatus.NO_BROWSER_API,
  GeolocationStatus.NO_USER_APPROVAL,
  GeolocationStatus.NO_POSITION,
  GeolocationStatus.NO_RESPONSE,
  GeolocationStatus.LOCATION_REQUEST_SUCCEEDED,
  GeolocationStatus.LOCATION_REQUEST_FAILED
]

@Component({
  components: {
    Button,
    Map,
    Fullscreen,
    ConfirmationOverlay
  }
})
export default class Location extends Vue {
  private geolocationStatus = '';
  private geolocationMessage = '';
  private currentPosition: Marker = {
    latitude: 0.0,
    longitude: 0.0,
    meterAccuracy: 0,
    type: MarkerType.USER_POSITION,
    id: ''
  };

  private isTestStarted = false;
  private testStatus: Status = Status.USER_INTERACTION_REQUIRED;
  private watchId = 0;

  get startTestButtonLabel() {
    return [Status.PENDING, Status.USER_INTERACTION_REQUIRED].includes(store.state.deviceTest.location.status)
      ? 'Testa GPS'
      : 'Testa GPS igen'
  }

  get startTestButtonType() {
    return [Status.PENDING, Status.USER_INTERACTION_REQUIRED].includes(store.state.deviceTest.location.status)
      ? 'primary'
      : 'secondary'
  }

  onStartTest() {
    this.isTestStarted = true
    this.geolocationStatus =
      'geolocation' in navigator
        ? GeolocationStatus.BROWSER_API_AVAILABLE
        : GeolocationStatus.NO_BROWSER_API
  }

  onDone() {
    this.isTestStarted = false
    store.setDeviceTestStatus('location', this.testStatus)
  }

  onUserAccept() {
    this.testStatus = Status.SUCCESS
    this.onDone()
  }

  onUserReject() {
    this.testStatus = Status.FAILURE
    this.onDone()
  }

  get isAccuratePosition() {
    const accuracy = this.currentPosition?.meterAccuracy || 0
    return LocationUtils.isAccuratePosition(accuracy)
  }

  get isPositioningDone() {
    return (
      this.testStatus === Status.USER_INTERACTION_REQUIRED &&
      this.geolocationStatus === GeolocationStatus.LOCATION_REQUEST_SUCCEEDED
    )
  }

  get isPositioningSuccessful() {
    return this.testStatus === Status.SUCCESS
  }

  get isPositioningPending() {
    return this.testStatus === Status.PENDING
  }

  get isPositioningFailed() {
    return this.testStatus === Status.FAILURE
  }

  get curPos() {
    return { ...this.currentPosition }
  }

  unmouted() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId)
    }
  }

  @Watch('geolocationStatus')
  onStatusChange(geolocationStatus: string) {
    if (LOGGED_STATUS.includes(geolocationStatus)) {
      const additionalProps =
        geolocationStatus === GeolocationStatus.LOCATION_REQUEST_SUCCEEDED
          ? { accuracy: this.currentPosition.meterAccuracy }
          : {}
      Analytics.logEvent(Analytics.AnalyticsEventType.LOCATION, 'set', 'status', {
        status: geolocationStatus,
        ...additionalProps
      })
    }
    switch (geolocationStatus) {
      case GeolocationStatus.UNKNOWN:
        this.testStatus = Status.PENDING
        this.geolocationMessage =
          'Vi vet inte om vi kan ta reda på din position.'
        break
      case GeolocationStatus.NO_BROWSER_API:
        this.testStatus = Status.FAILURE
        this.geolocationMessage =
          'Din webbläsare kan inte ta reda på din position.'
        break
      case GeolocationStatus.NO_USER_APPROVAL:
        this.testStatus = Status.FAILURE
        this.geolocationMessage =
          'Antingen är din GPS inte påslagen eller så blockerade du den.'
        break
      case GeolocationStatus.NO_POSITION:
        this.testStatus = Status.FAILURE
        this.geolocationMessage =
          'Det gick inte att fixera din position. Kanske åker du bil eller är på en plats med dålig mottagning?'
        break
      case GeolocationStatus.NO_RESPONSE:
        this.testStatus = Status.FAILURE
        this.geolocationMessage =
          'Det tog för lång tid att ta reda på din position så vi gav upp.'
        break
      case GeolocationStatus.BROWSER_API_AVAILABLE:
        this.testStatus = Status.PENDING
        this.geolocationMessage =
        'Vi jobbar på att ta reda på var du befinner dig.'
        this.geolocationStatus = GeolocationStatus.LOCATION_REQUEST_INITIATED

        this.watchId = navigator.geolocation.watchPosition(
          (position) => {
            const {
              coords: { accuracy, latitude, longitude }
            } = position
            this.currentPosition.meterAccuracy = accuracy
            this.currentPosition.latitude = latitude
            this.currentPosition.longitude = longitude
            this.geolocationStatus =
              GeolocationStatus.LOCATION_REQUEST_SUCCEEDED
          },
          (error) => {
            switch (error.code) {
              // 1 PERMISSION_DENIED The acquisition of the geolocation information failed because the page didn't have the permission to do it.
              case 1:
                this.geolocationStatus = GeolocationStatus.NO_USER_APPROVAL
                break
              // 2 POSITION_UNAVAILABLE The acquisition of the geolocation failed because one or several internal sources of position returned an internal error.
              case 2:
                this.geolocationStatus = GeolocationStatus.NO_POSITION
                break
              // 3 TIMEOUT The time allowed to acquire the geolocation, defined by PositionOptions.timeout information that was reached before the information was obtained.
              case 3:
                this.geolocationStatus = GeolocationStatus.NO_RESPONSE
                break
              default:
                this.geolocationStatus =
                  GeolocationStatus.LOCATION_REQUEST_FAILED
                break
            }
          }
        )
        break
      case GeolocationStatus.LOCATION_REQUEST_INITIATED:
        this.testStatus = Status.PENDING
        break
      case GeolocationStatus.LOCATION_REQUEST_SUCCEEDED:
        this.testStatus = Status.USER_INTERACTION_REQUIRED
        this.geolocationMessage = 'Vi tror oss veta var du befinner dig.'
        break
      case GeolocationStatus.LOCATION_REQUEST_FAILED:
        this.testStatus = Status.FAILURE
        this.geolocationMessage =
          'Av någon anledning kunde vi inte ta reda på din position.'
        break
      default:
        this.testStatus = Status.FAILURE
        this.geolocationMessage = 'Okänd status.'
        break
    }
  }
}
</script>

<style scoped>
.waiting-container {
  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: column;
  align-content: center;
  justify-content: center;
}
.waiting-container div {
  margin: 0 20px;
  text-align: center;
}

.done-container,
.done-container .container {
  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: column;
  align-content: center;
  justify-content: flex-end;
}
</style>
