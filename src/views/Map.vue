<template>
  <Page title="Karta">
    <div>
      <Message
        v-if="isError"
        header="Problem med kartan"
        :message="stateMessage"
        :type="stateMessageType"
      />
    </div>
    <div class="map-container" v-if="isMarkerListLoaded && !isError">
      <MapComponent :markers="checkpoints" />
      <ConfirmationOverlay
        v-if="activeMarkers.length"
        :question="atLocationText"
      />
    </div>
  </Page>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import Page from "@/components/layout/Page.vue";
import * as AuthUtils from "@/utils/Auth";
import MapComponent, {
  Coord,
  HIGH_ACCURACY_THRESHOLD,
  Marker,
  MarkerType,
} from "@/components/common/Map.vue";
import ConfirmationOverlay from "@/components/common/ConfirmationOverlay.vue";
import Message, { Type as MessageType } from "@/components/common/Message.vue";

const apiHost = process.env.VUE_APP_API_HOST;

enum State {
  INITIAL,
  LOADING_MARKERS,
  LOADING_POSITION,
  POSITION_ACQUIRED,
  ERROR,
}

type ApiMarker = {
  latitude: number;
  longitude: number;
  radius: number;
  name: string;
};

// Credits: https://stackoverflow.com/a/27943
//
// From https://nathanrooy.github.io/posts/2016-09-07/haversine-with-python/:
//   "Much of [this algorithm's] simplicity comes from the underlying assumption that
//   Earth is a perfect sphere (which it isn't...). Because of this, it can lead to
//   errors of up to 0.5%."

const coordinateDistance = (coord1: Coord, coord2: Coord) => {
  const R = 6371; // Radius of the Earth (in km)
  const dLat = deg2rad(coord2.latitude - coord1.latitude);
  const dLon = deg2rad(coord2.longitude - coord1.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(coord1.latitude)) *
      Math.cos(deg2rad(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c) * 1000.0; // Distance (in meter)
};

const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180);
};

@Component({
  components: {
    Page,
    MapComponent,
    Message,
    ConfirmationOverlay,
  },
})
export default class Map extends Vue {
  private state: State = State.INITIAL;
  private stateMessage: string = "";
  private stateMessageType: MessageType = MessageType.FAILURE;
  private watchId = 0;

  private markers: Marker[] = [];
  private activeMarkers: Marker[] = [];
  private currentPosition: Marker = {
    longitude: 17.833718,
    // longitude: 17.832718,
    latitude: 59.361201,
    meterAccuracy: 10,
    type: MarkerType.USER_POSITION,
  };

  get curPos() {
    return { ...this.currentPosition };
  }

  get isError() {
    return this.state === State.ERROR;
  }

  get atLocationText(): string {
    return this.activeMarkers.map(({ label }: Marker) => label).join(", ");
  }

  updateActiveMarkers(markers: Marker[], position: Marker) {
    if (position.meterAccuracy > HIGH_ACCURACY_THRESHOLD){
      return []
    }
    this.activeMarkers = markers.filter((marker: Marker) => {
      const distance = coordinateDistance(
        {
          latitude: position.latitude,
          longitude: position.longitude,
        },
        {
          latitude: marker.latitude,
          longitude: marker.longitude,
        }
      );
      // console.log(`📏 ${distance} meter to ${marker.label}`)
      const marginOfError =
        (marker.meterAccuracy || 0) +
        (position.meterAccuracy || 0);
      const isWithinMarker = distance - marginOfError <= 0;
      return isWithinMarker;
    });

  }

  @Watch("curPos")
  onPositionChange(newPosition: Marker) {
    console.log("New position is", newPosition);
    this.updateActiveMarkers(this.markers, newPosition)
  }

  @Watch("markers")
  onMarkersChange(newMarkers: Marker[]) {
    console.log("New markers are", newMarkers);
    this.updateActiveMarkers(newMarkers, this.currentPosition)
  }

  get checkpoints(): Marker[] {
    console.log("Get checkpoints");
    return [...this.markers, this.currentPosition];
  }

  get isMarkerListLoaded() {
    return this.markers.length > 0;
  }

  async loadMarkers() {
    const token = AuthUtils.getTokenCookie();
    if (token) {
      try {
        const resp = await fetch(
          `${apiHost}/wp-json/tuja/v1/map/markers?token=${token}`
        );
        const markers = await resp.json();

        this.markers = markers.map(
          ({ latitude, longitude, name, radius }: ApiMarker): Marker => ({
            latitude,
            longitude,
            meterAccuracy: radius,
            label: String(name),
            type: MarkerType.CHECKPOINT,
          })
        );
      } catch (e) {
        this.state = State.ERROR;
        this.stateMessage = "Kunde inte läsa in kontroller.";
        console.log("💥", e);
      }
    } else {
      console.log("No token");
    }
  }

  initLocationListener() {
    if ("geolocation" in navigator) {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          console.log("🌍 New position from geolocation API:", position);
          const {
            coords: { accuracy, latitude, longitude },
          } = position;
          this.currentPosition = {
            meterAccuracy: accuracy,
            latitude: latitude,
            longitude: longitude,
            type: MarkerType.USER_POSITION
          }
          this.state = State.POSITION_ACQUIRED;
        },
        (error) => {
          this.state = State.ERROR;
          switch (error.code) {
            // 1 PERMISSION_DENIED The acquisition of the geolocation information failed because the page didn't have the permission to do it.
            case 1:
              this.stateMessage =
                "Antingen är din GPS inte påslagen eller så blockerade du den.";
              break;
            // 2 POSITION_UNAVAILABLE The acquisition of the geolocation failed because one or several internal sources of position returned an internal error.
            case 2:
              this.stateMessage =
                "Det gick inte att fixera din position. Kanske åker du bil eller är på en plats med dålig mottagning?";
              break;
            // 3 TIMEOUT The time allowed to acquire the geolocation, defined by PositionOptions.timeout information that was reached before the information was obtained.
            case 3:
              this.stateMessage =
                "Det tog för lång tid att ta reda på din position så vi gav upp.";
              break;
            default:
              this.stateMessage =
                "Av någon anledning kunde vi inte ta reda på din position.";
              break;
          }
        }
      );
    }
  }

  async mounted() {
    this.state = State.LOADING_MARKERS;
    await this.loadMarkers();
    this.state = State.LOADING_POSITION;
    this.initLocationListener();
  }

  unmouted() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
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
</style>