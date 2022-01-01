<template>
  <div class="container">
    <div class="view-finder">
      <WebCam
        height="100%"
        width="100%"
        :resolution="{ width: 1980, height: 1080 }"
        ref="webcam"
        screenshot-format="image/jpg"
        :device-id="deviceId"
        @started="onStarted"
        @stopped="onStopped"
        @error="onError"
        @cameras="onCameras"
        @camera-change="onCameraChange"
      />
    </div>
    <div class="buttons">
      <IconButton
        v-if="isPlaying"
        @click="capture"
        icon="camera"
        size="huge"
      />
      <IconButton
        v-if="!!devices && devices.length > 1"
        @click="switchCamera"
        icon="switch"
        type="secondary"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import Button from '@/components/common/Button.vue'
import IconButton from '@/components/common/IconButton.vue'
import { WebCam } from 'vue-web-cam'
import * as Analytics from '@/utils/Analytics'

type DeviceData = {
  deviceId: string;
};

type Dimensions = {
  width: number;
  height: number;
};

@Component({
  components: { WebCam, Button, IconButton }
})
export default class Camera extends Vue {
  private deviceId?= '';
  private devices: DeviceData[] = [];
  private isPlaying = false;
  private videoActualDimensions: Dimensions | null = null;
  private videoPreviewDimensions: Dimensions | null = {
    width: 300,
    height: 300
  };

  @Watch('deviceId')
  onDeviceIdChange(deviceId: string) {
    Analytics.logEvent(Analytics.AnalyticsEventType.CAMERA, 'set', 'camera', { deviceId }, Analytics.LogLevel.INFO)
  }

  @Watch('devices')
  onDevicesValueChange() {
    // Once we have a list select the first one
    const [first, ...tail]: any[] = this.devices
    if (first) {
      this.deviceId = first.deviceId
    }
  }

  @Watch('videoActualDimensions')
  onVideoActualDimensionsChange(videoActualDimensions: Dimensions) {
    const { width, height } = videoActualDimensions.width
      ? videoActualDimensions
      : { width: 1980, height: 1080 }
    const ratio = width / height
    console.log(
      `📐 Aspect ratio of ${width}x${height} is ${ratio.toFixed(2)}.`
    )
    const maxSize = 400
    if (width > height) {
      this.videoPreviewDimensions = { width: maxSize, height: maxSize / ratio }
    } else {
      this.videoPreviewDimensions = { width: maxSize * ratio, height: maxSize }
    }
  }

  capture() {
    const cam: any = this.$refs.webcam
    const image = cam.capture()
    Analytics.logEvent(Analytics.AnalyticsEventType.CAMERA, 'capture', 'photo', { byteCount: image.length }, Analytics.LogLevel.INFO)
    this.$emit('captured', image)    
  }

  beforeDestroy() {
    const cam: any = this.$refs.webcam
    cam.stop()
  }

  mounted() {
    const cam: any = this.$refs.webcam
    cam.start()
  }

  switchCamera() {
    const currentIndex = this.devices.findIndex(
      (device) => device.deviceId === this.deviceId
    )
    this.deviceId =
      this.devices[(currentIndex + 1) % this.devices.length].deviceId
  }

  onStarted(mediaStream: any) {
    console.log('On Started Event', mediaStream)
    this.isPlaying = true

    mediaStream.getVideoTracks().forEach((videoTrack: any) => {
      const currentSettings = videoTrack.getSettings()
      console.log(`Got ${currentSettings.width}x${currentSettings.height}`)
      this.videoActualDimensions = {
        width: currentSettings.width,
        height: currentSettings.height
      }
    })
  }

  onStopped(stream: any) {
    console.log('On Stopped Event', stream)
    this.isPlaying = false
  }

  onError(error: any) {
    Analytics.logEvent(Analytics.AnalyticsEventType.CAMERA, 'caught', 'error', { ...error }, Analytics.LogLevel.WARNING)
  }

  onCameras(cameras: any) {
    this.devices = cameras
    Analytics.logEvent(Analytics.AnalyticsEventType.CAMERA, 'get', 'camera list', { count: cameras.length, deviceIds: cameras.map(({ deviceId }: any) => deviceId) }, Analytics.LogLevel.INFO)
  }

  onCameraChange(deviceId: string) {
    this.deviceId = deviceId
  }
}
</script>

<style scoped>
.container .buttons {
  position: absolute;
  bottom: 10px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  width: 100%;
  align-items: center;
}
/* Add 50px margin between shutter button and switch-camera button (margin added to switch-camera button): */
.container .buttons button:not(:first-child) {
  margin-left: 50px;
}
/* Add 100px margin to the left of the shutter button to "balance out" the switch-camera button: */
.container .buttons button:first-child:not(:only-child) {
  margin-left: 100px; /* Account for 50px margin + 50px button to the right of the button. */
}
.capture-button {
  height: 60px;
  width: 60px;
  /* margin-left: -25px; */
  border-radius: 30px;
  border: 5px solid #fff;
  background-color: rgba(255, 255, 255, 0.5);
  color: black;
  font-size: 150%;
}
</style>
