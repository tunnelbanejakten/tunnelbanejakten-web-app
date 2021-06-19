<template>
  <div class="container">
    <div id="map-container"></div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import Button from "@/components/common/Button.vue";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

export enum MarkerType {
  NORMAL,
  ACTIVE,
}

export type Marker = {
  latitude: number;
  longitude: number;
  label?: string;
  type?: MarkerType;
};

@Component({
  components: { Button },
})
export default class Map extends Vue {
  @Prop() private markers!: Marker[];
  @Prop() private currentPosition!: Marker;

  // Credits: https://github.com/Leaflet/Leaflet/issues/4968#issuecomment-483402699
  applyDeadIconFix() {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
      iconUrl: require("leaflet/dist/images/marker-icon.png"),
      shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
    });
  }

  initMap() {
    this.applyDeadIconFix();

    const map = L.map("map-container").setView(
      [this.currentPosition.latitude, this.currentPosition.longitude],
      15
    );
    L.marker([
      this.currentPosition.latitude,
      this.currentPosition.longitude,
    ]).addTo(map);

    this.markers.forEach(({ label, latitude, longitude, type }) => {
      L.circle([latitude, longitude], {
        stroke: true,
        radius: 50,

        color: type === MarkerType.ACTIVE ? "#F00" : "#000",
        opacity: 0.5,
        weight: 1,

        fillColor: type === MarkerType.ACTIVE ? "#FCC" : "#FFF",
        fillOpacity: 0.5,
      }).addTo(map);
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      id: "openstreetmap",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
  }

  mounted() {
    this.initMap();
  }
}
</script>

<style scoped>
#map-container {
  width: 100%;
  height: 400px;
}
</style>