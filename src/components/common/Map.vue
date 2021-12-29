<template>
  <div class="container">
    <div id="map-container" />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch, Emit } from 'vue-property-decorator'
import { dom } from '@fortawesome/fontawesome-svg-core'
import Button from '@/components/common/Button.vue'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import * as LocationUtils from '@/utils/Location'

const RECENTER_MAP_ICON_SIZE = 18

const getZoomLevel = (accuracyLevel: LocationUtils.AccuracyLevel) => {
  switch (accuracyLevel) {
    case LocationUtils.AccuracyLevel.HIGHEST:
      return 18
    case LocationUtils.AccuracyLevel.HIGH:
      return 16
    case LocationUtils.AccuracyLevel.MEDIUM:
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

// Icon for CHECK POINT SUBMITTED:
//   https://www.mappity.org/marker_icons/check/
//   Purple icon colour: #794794
const iconCheckpointSubmitted = L.icon({
  iconUrl: require('../../assets/map-markers/checkmark-purple-lowres.png'),
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  popupAnchor: [0, -34]
})

// Icon for START:
//   https://www.mappity.org/marker_icons/home/
//   Purple icon colour: #000000
const iconStart = L.icon({
  iconUrl: require('../../assets/map-markers/home-lowres.png'),
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  popupAnchor: [0, -34]
})

const getUserPositionColour = (meterAccuracy: number): any =>
  LocationUtils.getAccuracyLevel(meterAccuracy) === LocationUtils.AccuracyLevel.HIGHEST
    ? 'green'
    : LocationUtils.getAccuracyLevel(meterAccuracy) === LocationUtils.AccuracyLevel.HIGH
      ? 'yellow'
      : LocationUtils.getAccuracyLevel(meterAccuracy) === LocationUtils.AccuracyLevel.MEDIUM
        ? 'yellow'
        : 'orange'

export class Coord {
  latitude: number = 0;
  longitude: number = 0;
};

export class Marker extends Coord {
  meterAccuracy: number = 0;
  label?: string;
  showAccuracyCircle?: boolean;
};

export class StartPositionMarker extends Marker {
  // Only one start position is assumed
}

export class UserPositionMarker extends Marker {
  timestamp: number = 0 // Assumed to be unique
}

export class CheckpointMarker extends Marker {
  id: string = '' // Assumed to be unique
  submitted: boolean = false
}

@Component({
  components: { Button }
})
export default class Map extends Vue {
  @Prop() private markers!: Marker[];
  private mapObjects: Record<string, any> = {};
  private mapRef: any;
  private panLockControl: any;
  private isUserPanning = false
  private currentPosition!: Marker

  // Credits: https://github.com/Leaflet/Leaflet/issues/4968#issuecomment-483402699
  applyDeadIconFix() {
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
      iconUrl: require('leaflet/dist/images/marker-icon.png'),
      shadowUrl: require('leaflet/dist/images/marker-shadow.png')
    })
  }

  @Emit('marker-clicked')
  onMarkerClicked(marker: Marker) {
    return marker
  }

  @Watch('markers')
  updateMarkers(newMarkers: Marker[]) {

    const startPositionMarker = newMarkers.find(m => m instanceof StartPositionMarker) as StartPositionMarker
    this.updateStartPositionMarker(startPositionMarker)

    const userPositionMarkers = newMarkers.filter(m => m instanceof UserPositionMarker) as UserPositionMarker[]
    this.updateUserPositionMarkers(userPositionMarkers)

    const checkpointMarkers = newMarkers.filter(m => m instanceof CheckpointMarker) as CheckpointMarker[]
    this.updateCheckpointMarkers(checkpointMarkers)

    const curentUserPosition = userPositionMarkers.length ? userPositionMarkers[userPositionMarkers.length - 1] : null
    if (curentUserPosition) {
      this.currentPosition = curentUserPosition as Marker
      if (!this.isUserPanning) {
        this.panToCurrentPosition()
      }
    } else if (startPositionMarker) {
      this.currentPosition = startPositionMarker
      if (!this.isUserPanning) {
        this.panToCurrentPosition()
      }
    }
  }

  updateCheckpointMarkers(checkpointMarkers: CheckpointMarker[]) {
    const currentKeys: string[] = []
    for (const checkpointMarker of checkpointMarkers) {
      const latLong = [checkpointMarker.latitude, checkpointMarker.longitude]
      const key = `checkpoint-${checkpointMarker.id}`
      currentKeys.push(key)

      const accuracyCircleKey = `${key}-accuracyCircle`
      currentKeys.push(accuracyCircleKey)

      const existingMapObject = this.mapObjects[key]
      if (!existingMapObject) {
        // First time this checkpoint is rendered
        const mapMarker = L.marker(latLong, {
          icon: checkpointMarker.submitted ? iconCheckpointSubmitted : iconCheckpoint,
          zIndexOffset: 500
        })
        mapMarker.addTo(this.mapRef)
        this.mapObjects[key] = mapMarker

        if (checkpointMarker.showAccuracyCircle) {
          const accuracyCircle = L.circle(latLong, {
            stroke: true,
            fill: false,
            color: '#794794',
            weight: 1,
            radius: checkpointMarker.meterAccuracy
          })
          accuracyCircle.addTo(this.mapRef)
          this.mapObjects[accuracyCircleKey] = accuracyCircle
        }
      } else {
        // Update position
        existingMapObject.setLatLng(latLong)
      }
    }
    this.removeMapMarkers('checkpoint-', currentKeys)
  }

  updateUserPositionMarkers(userPositionMarkers: UserPositionMarker[]) {
    userPositionMarkers.sort((a, b) => a.timestamp - b.timestamp) // Oldest first
    const currentKeys: string[] = []
    userPositionMarkers.forEach((userPositionMarker, index) => {
      const isCurrent = index === userPositionMarkers.length - 1
      const positionRelativeAge = userPositionMarkers.length - index
      const opacity = Math.max(0.1, 1.0 - (positionRelativeAge * 0.15))

      const key = `userPosition-${userPositionMarker.timestamp}-${isCurrent}`
      const accuracyCircleKey = `${key}-accuracyCircle`
      currentKeys.push(key, accuracyCircleKey)

      const existingMapObject = this.mapObjects[key]
      if (!existingMapObject) {
        const latLong = [userPositionMarker.latitude, userPositionMarker.longitude]
        const lineStyle = {
          stroke: true,
          fill: false,
          color: getUserPositionColour(userPositionMarker.meterAccuracy),
          opacity: opacity,
          weight: 1
        }
        // First time this user position is rendered
        const mapMarker = isCurrent
          // Render map pin for current position:
          ? L.marker(latLong, {
            icon: iconUserPosition,
            zIndexOffset: 1000
          })
          // Render (fading) line for breadcrumbs:
          : L.polyline(
            [
              latLong,
              [userPositionMarkers[index + 1].latitude, userPositionMarkers[index + 1].longitude]
            ],
            lineStyle)
        mapMarker.addTo(this.mapRef)
        this.mapObjects[key] = mapMarker

        if (userPositionMarker.showAccuracyCircle) {
          const accuracyCircle = L.circle(latLong, lineStyle)
          accuracyCircle.setRadius(userPositionMarker.meterAccuracy)
          accuracyCircle.addTo(this.mapRef)
          this.mapObjects[accuracyCircleKey] = accuracyCircle
        }
      } else {
        // Update position
        if (!isCurrent) {
          existingMapObject.setStyle({
            opacity
          })
          const accuracyCircle = this.mapObjects[accuracyCircleKey]
          if (accuracyCircle) {
            accuracyCircle.setStyle({
              opacity
            })
          }
        }
      }
    })
    this.removeMapMarkers('userPosition-', currentKeys)
  }

  updateStartPositionMarker(startPositionMarker: StartPositionMarker) {
    const existingMapObject = this.mapObjects.startPosition
    if (!startPositionMarker && !existingMapObject) {
      // Nothing to do
    } else if (startPositionMarker && !existingMapObject) {
      // First time start position is rendered
      const mapMarker = L.marker([startPositionMarker.latitude, startPositionMarker.longitude], {
        icon: iconStart,
        zIndexOffset: 0
      })
      mapMarker.on('click', () => this.onMarkerClicked(startPositionMarker))
      mapMarker.addTo(this.mapRef)
      this.mapObjects.startPosition = mapMarker
    } else if (!startPositionMarker && existingMapObject) {
      // Start position should no longer be rendered
      existingMapObject.remove()
    } else {
      // Update position
      existingMapObject.setLatLng([startPositionMarker.latitude, startPositionMarker.longitude])
    }
  }

  removeMapMarkers(includeKeyPrefix: string, excludeKeys: string[]) {
    Object.keys(this.mapObjects)
      .filter(key => key.substring(0, includeKeyPrefix.length) === includeKeyPrefix && !excludeKeys.includes(key))
      .forEach(key => {
        this.mapObjects[key].remove()
        delete this.mapObjects[key]
      })
  }

  panToCurrentPosition() {
    const zoomLevel = getZoomLevel(
      LocationUtils.getAccuracyLevel(this.currentPosition.meterAccuracy || 0)
    )

    this.mapRef.off('movestart', this.onUserMapPan)

    this.mapRef.setZoom(zoomLevel)
    this.mapRef.panTo([this.currentPosition.latitude, this.currentPosition.longitude], {
      animate: true,
      duration: 0.5
    })

    this.mapRef.on('movestart', this.onUserMapPan)
  }

  onUserMapPan() {
    this.isUserPanning = true

    this.panLockControl.addTo(this.mapRef)
  }

  onRecenterMap() {
    this.isUserPanning = false

    this.panLockControl.remove()

    this.panToCurrentPosition()
  }

  applyPanLockControlExtension() {
    L.Control.PanLock = L.Control.extend({
      onAdd: () => {
        // Create container element
        const container = L.DomUtil.create('div')
        L.DomUtil.addClass(container, 'leaflet-bar')
        L.DomUtil.addClass(container, 'leaflet-control')

        // Create button element inside container
        const button = L.DomUtil.create('a', null, container)
        button.id = 'panLockButton'
        button.role = 'button'
        button.title = 'Re-center map'
        button.ariaLabel = 'Re-center map'
        button.href = '#'
        button.style.lineHeight = (RECENTER_MAP_ICON_SIZE * 2) + 'px'
        L.DomEvent.on(button, 'click', this.onRecenterMap)

        // Create icon element inside button
        const icon = L.DomUtil.create('i', null, button)
        L.DomUtil.addClass(icon, 'fas')
        L.DomUtil.addClass(icon, 'fa-crosshairs')
        icon.style.fontSize = (RECENTER_MAP_ICON_SIZE) + 'px'
        dom.i2svg({ node: button, callback: () => { return true } })

        return container
      },
      onRemove: (map: any) => {
        // Nothing
      }
    })

    L.control.panLock = (opts: any) => {
      return new L.Control.PanLock(opts)
    }
  }

  initMap() {
    this.applyDeadIconFix()
    this.applyPanLockControlExtension()

    this.mapRef = L.map('map-container', { tap: false })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      zoom: 15,
      id: 'openstreetmap',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.mapRef)

    this.mapRef.on('movestart', this.onUserMapPan)

    this.panLockControl = L.control.panLock({ position: 'topleft' })
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
