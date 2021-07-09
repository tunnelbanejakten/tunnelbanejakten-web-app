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

const getAccuracyLevel = (meterAccuracy: number): AccuracyLevel => {
  return meterAccuracy < 100
    ? AccuracyLevel.HIGHEST
    : meterAccuracy < 200
      ? AccuracyLevel.HIGH
      : meterAccuracy < 500
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

const MARKER_BASE_STYLE = {
  stroke: true,

  color: '#000',
  opacity: 0.5,
  weight: 5,

  fillColor: '#0F0',
  fillOpacity: 0.5
}

const getMarkerStyle = (meterAccuracy: number) : any => ({
  ...MARKER_BASE_STYLE,
  radius: meterAccuracy,
  fillColor:
    getAccuracyLevel(meterAccuracy) === AccuracyLevel.HIGHEST
      ? 'green'
      : getAccuracyLevel(meterAccuracy) === AccuracyLevel.HIGH
        ? 'yellow'
        : getAccuracyLevel(meterAccuracy) === AccuracyLevel.MEDIUM
          ? 'yellow'
          : 'orange'
})

export enum MarkerType {
  NORMAL,
  ACTIVE,
}

enum AccuracyLevel {
  HIGHEST,
  HIGH,
  MEDIUM,
  LOW,
}

export type Marker = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  label?: string;
  type?: MarkerType;
};

@Component({
  components: { Button }
})
export default class Map extends Vue {
  @Prop() private markers!: Marker[];
  @Prop() private currentPosition!: Marker;
  private currentPositionMapRef: any;
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
  updateMarkers(newMarkers: Marker[]) {
    console.log('Update markers')
  }

  @Watch('currentPosition')
  updatePosition(newPosition: Marker) {
    console.log('🌍 Update map marker:', newPosition)
    const accuracy = newPosition.accuracy || 10000
    const zoomLevel = getZoomLevel(getAccuracyLevel((newPosition.accuracy || 0) * 1000))

    this.currentPositionMapRef.setRadius((newPosition.accuracy || 0) * 1000)
    this.currentPositionMapRef.setLatLng([
      newPosition.latitude,
      newPosition.longitude
    ])

    this.mapRef.setZoom(zoomLevel)
    this.mapRef.panTo([newPosition.latitude, newPosition.longitude], {
      animate: true,
      duration: 0.5
    })
  }

  initMap() {
    this.applyDeadIconFix()

    this.mapRef = L.map('map-container')
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      zoom: 15,
      id: 'openstreetmap',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.mapRef)
    for (const marker of this.markers || []) {
      const { label, latitude, longitude, type, accuracy } = marker

      L.circle([latitude, longitude], {
        stroke: true,
        radius: (accuracy || 0.01) * 1000,

        color: type === MarkerType.ACTIVE ? '#F00' : '#000',
        opacity: 0.5,
        weight: 1,

        fillColor: type === MarkerType.ACTIVE ? '#FCC' : '#FFF',
        fillOpacity: 0.5
      }).addTo(this.mapRef)
    }

    this.currentPositionMapRef = L.circle(
      [this.currentPosition.latitude, this.currentPosition.longitude],
      getMarkerStyle((this.currentPosition.accuracy || 0) * 1000)
    )
    this.currentPositionMapRef.addTo(this.mapRef)

    this.updatePosition(this.currentPosition)
  }

  mounted() {
    this.initMap()
  }
}
</script>

<style scoped>
#map-container {
  width: 100%;
  height: 100%;
}
</style>
