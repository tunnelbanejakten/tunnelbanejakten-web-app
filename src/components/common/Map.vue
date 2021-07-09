<template>
  <div class="container">
    <div id="map-container" />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import Button from '@/components/common/Button.vue'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import * as LocationUtils from '@/utils/Location'

const getAccuracyLevel = (meterAccuracy: number): AccuracyLevel => {
  return LocationUtils.isAccuratePosition(meterAccuracy)
    ? AccuracyLevel.HIGHEST
    : meterAccuracy < 100
      ? AccuracyLevel.HIGH
      : meterAccuracy < 250
        ? AccuracyLevel.MEDIUM
        : AccuracyLevel.LOW
}

const getZoomLevel = (accuracyLevel: AccuracyLevel) => {
  switch (accuracyLevel) {
    case AccuracyLevel.HIGHEST:
      return 18
    case AccuracyLevel.HIGH:
      return 16
    case AccuracyLevel.MEDIUM:
      return 15
    default:
      return 13
  }
}

// Icon for USER POSITION:
//   https://www.mappity.org/marker_icons/circle/
//   Red icon colour: #ff1100
//   Purple icon colour: #794794
const iconUserPosition = L.icon({
  iconUrl: require('../../assets/map-markers/user-position-red-lowres.png'),
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -34]
})

// Icon for CHECK POINT:
//   https://www.mappity.org/marker_icons/bullseye/
//   Orange icon colour: #ffaa00
//   Purple icon colour: #794794
const iconCheckpoint = L.icon({
  iconUrl: require('../../assets/map-markers/checkpoint-purple-lowres.png'),
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  popupAnchor: [0, -34]
})

const getUserPositionColour = (meterAccuracy: number): any =>
  getAccuracyLevel(meterAccuracy) === AccuracyLevel.HIGHEST
    ? 'green'
    : getAccuracyLevel(meterAccuracy) === AccuracyLevel.HIGH
      ? 'yellow'
      : getAccuracyLevel(meterAccuracy) === AccuracyLevel.MEDIUM
        ? 'yellow'
        : 'orange'

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
  components: { Button }
})
export default class Map extends Vue {
  @Prop() private markers!: Record<string, Marker>;
  private mapObjects: Record<string, any> = {};
  private mapRef: any;

  // Credits: https://github.com/Leaflet/Leaflet/issues/4968#issuecomment-483402699
  applyDeadIconFix() {
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
      iconUrl: require('leaflet/dist/images/marker-icon.png'),
      shadowUrl: require('leaflet/dist/images/marker-shadow.png')
    })
  }

  @Watch('markers')
  updateMarkers(newMarkers: Record<string, Marker>) {
    for (const [key, marker] of Object.entries(newMarkers)) {
      const { label, latitude, longitude, type, meterAccuracy } = marker

      const style = {
        stroke: false,
        radius: meterAccuracy || 10,

        fillColor:
          type === MarkerType.CHECKPOINT
            ? '#794794'
            : getUserPositionColour(meterAccuracy),
        fillOpacity: type === MarkerType.CHECKPOINT ? 0.5 : 0.25
      }

      const keyMarker = key + '-marker'
      const keyBounds = key + '-bounds'

      if (!Object.keys(this.mapObjects).includes(keyMarker)) {
        // Create new marker
        this.mapObjects[keyBounds] = L.circle([latitude, longitude], style)
        this.mapObjects[keyBounds].addTo(this.mapRef)
        this.mapObjects[keyMarker] = L.marker([latitude, longitude], {
          icon:
            type === MarkerType.CHECKPOINT ? iconCheckpoint : iconUserPosition,
          zIndexOffset: type === MarkerType.CHECKPOINT ? 0 : 1000
        })
          .bindPopup(
            type === MarkerType.CHECKPOINT ? marker.label : 'Din position'
          )
          .openPopup()
        this.mapObjects[keyMarker].addTo(this.mapRef)
      }

      // Update position and design for the "area or accuracy indicator"
      const objBounds = this.mapObjects[keyBounds]
      objBounds.setStyle({ fillColor: style.fillColor })
      objBounds.setRadius(style.radius)
      objBounds.setLatLng([latitude, longitude])

      // Update position and design for the "pin"
      const objMarker = this.mapObjects[keyMarker]
      objMarker.setLatLng([latitude, longitude])
    }

    const userPosition = Object.values(newMarkers).find(
      (marker: Marker) => marker.type === MarkerType.USER_POSITION
    )
    if (userPosition) {
      const zoomLevel = getZoomLevel(
        getAccuracyLevel(userPosition.meterAccuracy || 0)
      )

      this.mapRef.setZoom(zoomLevel)
      this.mapRef.panTo([userPosition.latitude, userPosition.longitude], {
        animate: true,
        duration: 0.5
      })
    }
  }

  initMap() {
    this.applyDeadIconFix()

    this.mapRef = L.map('map-container', { tap: false })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      zoom: 15,
      id: 'openstreetmap',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.mapRef)
  }

  mounted() {
    this.initMap()
    this.updateMarkers(this.markers)
  }
}
</script>

<style scoped>
#map-container {
  width: 100%;
  height: 100%;
}
</style>
