<template>
  <div class="container">
    <div id="map-container" />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import Button from "@/components/common/Button.vue";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

export const HIGH_ACCURACY_THRESHOLD = 50

const getAccuracyLevel = (meterAccuracy: number): AccuracyLevel => {
  return meterAccuracy < HIGH_ACCURACY_THRESHOLD
    ? AccuracyLevel.HIGHEST
    : meterAccuracy < 100
    ? AccuracyLevel.HIGH
    : meterAccuracy < 250
    ? AccuracyLevel.MEDIUM
    : AccuracyLevel.LOW;
};

const getZoomLevel = (accuracyLevel: AccuracyLevel) => {
  switch (accuracyLevel) {
    case AccuracyLevel.HIGHEST:
      return 18;
    case AccuracyLevel.HIGH:
      return 16;
    case AccuracyLevel.MEDIUM:
      return 15;
    default:
      return 13;
  }
};

const MARKER_BASE_STYLE = {
  stroke: true,

  color: "#000",
  opacity: 0.5,
  weight: 5,

  fillColor: "#0F0",
  fillOpacity: 0.5,
};

const getUserPositionColour = (meterAccuracy: number): any =>
  getAccuracyLevel(meterAccuracy) === AccuracyLevel.HIGHEST
    ? "green"
    : getAccuracyLevel(meterAccuracy) === AccuracyLevel.HIGH
    ? "yellow"
    : getAccuracyLevel(meterAccuracy) === AccuracyLevel.MEDIUM
    ? "yellow"
    : "orange";

export enum MarkerType {
  CHECKPOINT,
  USER_POSITION,
}

enum AccuracyLevel {
  HIGHEST,
  HIGH,
  MEDIUM,
  LOW,
}

export type Coord = {
  latitude: number;
  longitude: number;
};

export type Marker = Coord & {
  meterAccuracy: number;
  label?: string;
  type: MarkerType;
};

@Component({
  components: { Button },
})
export default class Map extends Vue {
  @Prop() private markers!: Record<string, Marker>;
  private markerRefs: Record<string, any> = {};
  private mapRef: any;

  // Credits: https://github.com/Leaflet/Leaflet/issues/4968#issuecomment-483402699
  applyDeadIconFix() {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
      iconUrl: require("leaflet/dist/images/marker-icon.png"),
      shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
    });
  }

  @Watch("markers")
  updateMarkers(newMarkers: Record<string, Marker>) {
    console.log("Markers updated", newMarkers);
    for (const [key, marker] of Object.entries(newMarkers)) {
      const { label, latitude, longitude, type, meterAccuracy } = marker;

      const style = {
        stroke: type === MarkerType.CHECKPOINT,
        radius: meterAccuracy || 10,

        color: type === MarkerType.CHECKPOINT ? "#F00" : "#000",
        opacity: 0.5,
        weight: 1,

        fillColor:
          type === MarkerType.CHECKPOINT
            ? "#FCC"
            : getUserPositionColour(meterAccuracy),
        fillOpacity: type === MarkerType.CHECKPOINT ? 0.5 : 0.25,
      };
      if (!Object.keys(this.markerRefs).includes(key)) {
        // Create new marker
        this.markerRefs[key] = L.circle([latitude, longitude], style);
        this.markerRefs[key].addTo(this.mapRef);
      }
      const ref = this.markerRefs[key];
      
      const styleUpdates = { fillColor: style.fillColor }
      ref.setStyle(styleUpdates);
      ref.setRadius(style.radius)
      
      ref.setLatLng([latitude, longitude]);
    }

    const userPosition = Object.values(newMarkers).find(
      (marker: Marker) => marker.type === MarkerType.USER_POSITION
    );
    if (userPosition) {
      console.log("🌍 Update user position:", userPosition);
      const zoomLevel = getZoomLevel(
        getAccuracyLevel(userPosition.meterAccuracy || 0)
      );

      this.mapRef.setZoom(zoomLevel);
      this.mapRef.panTo([userPosition.latitude, userPosition.longitude], {
        animate: true,
        duration: 0.5,
      });
    }
  }

  initMap() {
    this.applyDeadIconFix();

    this.mapRef = L.map("map-container");
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      zoom: 15,
      id: "openstreetmap",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.mapRef);
  }

  mounted() {
    this.initMap();
    this.updateMarkers(this.markers);
  }
}
</script>

<style scoped>
#map-container {
  width: 100%;
  height: 100%;
}
</style>
