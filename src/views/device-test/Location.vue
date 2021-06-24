<template>
  <div>
    <p>
      Vissa uppgifter under tävlingen kräver att ni befinner er på vissa
      platser. Därför behöver vi få tillgång till din GPS.
    </p>
    <Button label="Testa GPS" @click="onStartTest" :type="!isPositioningSuccessful ? 'primary' : 'secondary'" />
    <Fullscreen v-if="isTestStarted">
      <div v-if="isPositioningPending" class="waiting-container">
        <div>
          {{ geolocationMessage }}
        </div>
      </div>
      <div v-if="isPositioningFailed" class="waiting-container">
        <div>
          {{ geolocationMessage }}
        </div>
        <div>
          <Button label="Ok" @click="onDone" />
        </div>
      </div>
      <div v-if="isPositioningDone">
        <Map :markers="markers" :currentPosition="currentPosition" />
        <p>Befinner du dig i den gröna cirkeln?</p>
        <div>
          <Button label="Ja" @click="onUserAccept" />
          <Button label="Nej" @click="onUserReject" type="secondary" />
        </div>
      </div>
    </Fullscreen>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import Button from "@/components/common/Button.vue";
import Fullscreen from "@/components/common/Fullscreen.vue";
import Map, { Marker, MarkerType } from "@/components/common/Map.vue";
import store, { Status } from "@/store";

const GeolocationStatus = {
  UNKNOWN: "UNKNOWN",
  NO_BROWSER_API: "NO_BROWSER_API",
  NO_USER_APPROVAL: "NO_USER_APPROVAL",
  NO_POSITION: "NO_POSITION",
  NO_RESPONSE: "NO_RESPONSE",
  BROWSER_API_AVAILABLE: "BROWSER_API_AVAILABLE",
  LOCATION_REQUEST_INITIATED: "LOCATION_REQUEST_INITIATED",
  LOCATION_REQUEST_SUCCEEDED: "LOCATION_REQUEST_SUCCEEDED",
  LOCATION_REQUEST_FAILED: "LOCATION_REQUEST_FAILED",
};

@Component({
  components: {
    Button,
    Map,
    Fullscreen,
  },
})
export default class Location extends Vue {
  private geolocationStatus = "";
  private geolocationMessage = "";
  private currentPosition?: Marker;
  private isTestStarted: boolean = false;
  private testStatus: Status = Status.USER_INTERACTION_REQUIRED

  onStartTest() {
    this.isTestStarted = true;
    this.geolocationStatus =
      "geolocation" in navigator
        ? GeolocationStatus.BROWSER_API_AVAILABLE
        : GeolocationStatus.NO_BROWSER_API;
  }

  onDone() {
    this.isTestStarted = false;
    store.setDeviceTestStatus("location", this.testStatus);
  }

  onUserAccept() {
    this.testStatus = Status.SUCCESS;
    this.onDone()
  }

  onUserReject() {
    this.testStatus = Status.FAILURE;
    this.onDone()
  }

  get isPositioningDone() {
    return this.testStatus === Status.USER_INTERACTION_REQUIRED && this.geolocationStatus === GeolocationStatus.LOCATION_REQUEST_SUCCEEDED
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

  @Watch("geolocationStatus")
  onStatusChange(geolocationStatus: string) {
    switch (geolocationStatus) {
      case GeolocationStatus.UNKNOWN:
        this.testStatus = Status.PENDING;
        this.geolocationMessage =
          "Vi vet inte om vi kan ta reda på din position.";
        break;
      case GeolocationStatus.NO_BROWSER_API:
        this.testStatus = Status.FAILURE;
        this.geolocationMessage =
          "Din webbläsare kan inte ta reda på din position.";
        break;
      case GeolocationStatus.NO_USER_APPROVAL:
        this.testStatus = Status.FAILURE;
        this.geolocationMessage =
          "Antingen är din GPS inte påslagen eller så blockerade du den.";
        break;
      case GeolocationStatus.NO_POSITION:
        this.testStatus = Status.FAILURE;
        this.geolocationMessage =
          "Det gick inte att fixera din position. Kanske åker du bil eller är på en plats med dålig mottagning?";
        break;
      case GeolocationStatus.NO_RESPONSE:
        this.testStatus = Status.FAILURE;
        this.geolocationMessage =
          "Det tog för lång tid att ta reda på din position så vi gav upp.";
        break;
      case GeolocationStatus.BROWSER_API_AVAILABLE:
        this.testStatus = Status.PENDING;
        this.geolocationMessage =
          "Vi jobbar på att ta reda på var du befinner dig.";
        this.geolocationStatus = GeolocationStatus.LOCATION_REQUEST_INITIATED;

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const {
              coords: { accuracy, latitude, longitude },
            } = position;
            this.currentPosition = {
              accuracy: (1.0 * accuracy) / 1000,
              latitude: latitude,
              longitude: longitude,
            };
            this.geolocationStatus =
              GeolocationStatus.LOCATION_REQUEST_SUCCEEDED;
          },
          (error) => {
            switch (error.code) {
              // 1 PERMISSION_DENIED The acquisition of the geolocation information failed because the page didn't have the permission to do it.
              case 1:
                this.geolocationStatus = GeolocationStatus.NO_USER_APPROVAL;
                break;
              // 2 POSITION_UNAVAILABLE The acquisition of the geolocation failed because one or several internal sources of position returned an internal error.
              case 2:
                this.geolocationStatus = GeolocationStatus.NO_POSITION;
                break;
              // 3 TIMEOUT The time allowed to acquire the geolocation, defined by PositionOptions.timeout information that was reached before the information was obtained.
              case 3:
                this.geolocationStatus = GeolocationStatus.NO_RESPONSE;
                break;
              default:
                this.geolocationStatus =
                  GeolocationStatus.LOCATION_REQUEST_FAILED;
                break;
            }
          }
        );
        break;
      case GeolocationStatus.LOCATION_REQUEST_INITIATED:
        this.testStatus = Status.PENDING;
        break;
      case GeolocationStatus.LOCATION_REQUEST_SUCCEEDED:
        this.testStatus = Status.USER_INTERACTION_REQUIRED;
        this.geolocationMessage = "Vi tror oss veta var du befinner dig.";
        break;
      case GeolocationStatus.LOCATION_REQUEST_FAILED:
        this.testStatus = Status.FAILURE;
        this.geolocationMessage =
          "Av någon anledning kunde vi inte ta reda på din position.";
        break;
      default:
        this.testStatus = Status.FAILURE;
        this.geolocationMessage = "Okänd status.";
        break;
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
}
</style>