<template>
  <div :class="containerClass">
    <div
      v-if="!isStartedState"
      class="state"
    >
      <span v-if="!isFailedState">
        {{ stateDescription }}
      </span>
      <Message
        v-if="isFailedState"
        header="Oj då"
        :message="stateDescription"
        type="failure"
      />
    </div>
    <CameraViewfinder
      ref="webcam"
      @stopped="onStopped"
      @video-live="onVideoLive"
    />
    <div class="buttons">
      <IconButton
        v-if="isStartedState"
        @click="capture"
        icon="camera"
        size="huge"
      />
      <IconButton
        v-if="isStartedState && environmentDeviceId && selfieDeviceId"
        @click="switchCamera"
        icon="switch"
        type="secondary"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import Message from '@/components/common/Message.vue'
import Button from '@/components/common/Button.vue'
import IconButton from '@/components/common/IconButton.vue'
import CameraViewfinder from './CameraViewfinder.vue'
import * as Analytics from '@/utils/Analytics'

type Dimensions = {
  width: number;
  height: number;
};

enum State {
  INIT,
  CHECKING,
  STARTING,
  STARTED,
  FAILED
}

enum CameryType {
  ANY,
  USER,
  ENVIRONMENT
}

@Component({
  components: { CameraViewfinder, Button, IconButton, Message }
})
export default class Camera extends Vue {
  private _selectedDeviceId: string | undefined;
  private selfieDeviceId: string | undefined
  private environmentDeviceId: string | undefined
  private state: State = State.INIT
  private failedMessage: string = ''

  get containerClass() {
    return `container state-${State[this.state].toLowerCase()}`
  }

  selectedDevice(deviceId: string | undefined) {
    this._selectedDeviceId = deviceId
    if (deviceId) {
      this.startCamera(deviceId)
    } else {
      this.setFailed('Ingen kamera vald')
      this.stopCamera()
    }
  }

  get isInitState() { return this.state === State.INIT }
  get isCheckingState() { return this.state === State.CHECKING }
  get isStartingState() { return this.state === State.STARTING }
  get isStartedState() { return this.state === State.STARTED }
  get isFailedState() { return this.state === State.FAILED }

  get stateDescription() {
    switch (this.state) {
      case State.INIT:
        return 'Kollar om det ens kan finnas några kameror'
      case State.CHECKING:
        return 'Kollar vilka kameror som finns'
      case State.STARTING:
        return 'Kameran startas'
      case State.STARTED:
        return 'Kameran är igång'
      case State.FAILED:
        return this.failedMessage || 'Oj, något gick fel'
    }
  }

  capture() {
    const cam: any = this.$refs.webcam
    if (cam) {
      const image = cam.capture()
      Analytics.logEvent(Analytics.AnalyticsEventType.CAMERA, 'capture', 'photo', { byteCount: image.length }, Analytics.LogLevel.INFO)
      this.$emit('captured', image)
    }
  }

  beforeDestroy() {
    this.stopCamera()
  }

  mounted() {
    this.initBrowserApi()
  }

  switchCamera() {
    const nextDevice = this._selectedDeviceId === this.environmentDeviceId
      ? this.selfieDeviceId
      : this.environmentDeviceId
    this.selectedDevice(nextDevice)
  }

  onVideoLive(mediaStream: any) {
    this.state = State.STARTED

    mediaStream.getVideoTracks().forEach((videoTrack: any) => {
      const currentSettings = videoTrack.getSettings()
      Analytics.logEvent(Analytics.AnalyticsEventType.CAMERA, 'start', 'camera', { ...currentSettings }, Analytics.LogLevel.DEBUG)
    })
  }

  setFailed(message: string = '') {
    this.state = State.FAILED
    this.failedMessage = message
  }

  onStopped(stream: any) {
    Analytics.logEvent(Analytics.AnalyticsEventType.CAMERA, 'stopped', 'camera', {}, Analytics.LogLevel.DEBUG)
  }

  createLegacyGetUserMediaWrapper() {
    return (constraints: any) => {
      // First get ahold of the legacy getUserMedia, if present
      const legacyNavigator: any = navigator
      const getUserMedia =
        legacyNavigator.getUserMedia ||
        legacyNavigator.webkitGetUserMedia ||
        legacyNavigator.mozGetUserMedia ||
        legacyNavigator.msGetUserMedia ||
        legacyNavigator.oGetUserMedia;

      // Some browsers just don't implement it - return a rejected promise with an error
      // to keep a consistent interface
      if (!getUserMedia) {
        return Promise.reject(
          new Error("getUserMedia is not implemented in this browser")
        );
      }

      // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
      return new Promise(function (resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }

  initBrowserApi() {
    const legacyNavigator: any = navigator
    if (legacyNavigator.mediaDevices === undefined) {
      legacyNavigator.mediaDevices = {};
    }

    if (legacyNavigator.mediaDevices.getUserMedia === undefined) {
      legacyNavigator.mediaDevices.getUserMedia = this.createLegacyGetUserMediaWrapper();
    }

    this.testMediaAccess();
  }

  translateGetUserMediaError(errorName: string): string {
    switch (errorName) {
      case 'AbortError':
        // Although the user and operating system both granted access to the hardware device, and no hardware issues occurred that would 
        // cause a NotReadableError, throw if some problem occurred which prevented the device from being used.
        return 'Kameran kunde inte startas'
      case 'NotAllowedError':
        // Thrown if one or more of the requested source devices cannot be used at this time. This will happen if the browsing context is 
        // insecure (that is, the page was loaded using HTTP rather than HTTPS). It also happens if the user has specified that the current browsing 
        // instance is not permitted access to the device, the user has denied access for the current session, or the user has denied all access to 
        // user media devices globally. On browsers that support managing media permissions with Feature Policy, this error is returned if 
        // Feature Policy is not configured to allow access to the input source(s).
        return 'Kameran kan inte användas. Godkände du att den här sidan får använda kameran?'
      case 'NotFoundError':
        // Thrown if no media tracks of the type specified were found that satisfy the given constraints.
        return 'Vi hittade ingen kamera'
        break
      case 'NotReadableError':
        // Thrown if, although the user granted permission to use the matching devices, a hardware error occurred at the 
        // operating system, browser, or web page level which prevented access to the device.
        return 'Kameran kunde inte startas'
      case 'OverconstrainedError':
        // Thrown if the specified constraints resulted in no candidate devices which met the criteria requested.
        // The error is an object of type OverconstrainedError, and has a constraint property whose string value is the name of a 
        // constraint which was impossible to meet, and a message property containing a human - readable string explaining the problem.
        return 'Din kamera uppfyller tyvärr inte våra krav'
      case 'SecurityError':
        // Thrown if user media support is disabled on the Document on which getUserMedia() was called. The mechanism by which 
        // user media support is enabled and disabled is left up to the individual user agent.
        return 'Kameran har blockerats av säkerhetsskäl. Testa med en annan webbläsare eller kontrollera dina kamerainställningar.'
      case 'TypeError':
        // Thrown if the list of constraints specified is empty, or has all constraints set to false. This can also happen if you 
        // try to call getUserMedia() in an insecure context, since navigator.mediaDevices is undefined in an insecure context.
        return 'Din kamera uppfyller tyvärr inte våra krav'
      default:
        return 'Ett oväntat fel uppstod'
    }
  }

  async findCamera(cameraType: CameryType): Promise<string | undefined> {
    try {
      const constraints = this.getCameraConstraints({ cameraType })
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      const deviceId = stream.getVideoTracks().map(track => track.getSettings().deviceId).shift()
      stream.getTracks().forEach(track => track.stop())
      Analytics.logEvent(Analytics.AnalyticsEventType.CAMERA, 'completed', 'camera lookup', { deviceId, constraints: JSON.stringify(constraints) }, Analytics.LogLevel.DEBUG)
      return deviceId
    } catch ({ name, code, message }: any) {
      Analytics.logEvent(Analytics.AnalyticsEventType.CAMERA, 'failed', 'camera lookup', { name, code, message }, Analytics.LogLevel.DEBUG)
      this.setFailed(this.translateGetUserMediaError(String(name)))
      return undefined
    }
  }

  async testMediaAccess() {
    this.state = State.CHECKING
    try {
      const environmentDeviceId = await this.findCamera(CameryType.ENVIRONMENT)
      const selfieDeviceId = await this.findCamera(CameryType.USER)
      if (environmentDeviceId && selfieDeviceId) {
        this.environmentDeviceId = environmentDeviceId
        if (environmentDeviceId != selfieDeviceId) {
          this.selfieDeviceId = selfieDeviceId
        } else {
          this.selfieDeviceId = selfieDeviceId
        }
        this.selectedDevice(this.environmentDeviceId)
      } else if (environmentDeviceId || selfieDeviceId) {
        this.environmentDeviceId = environmentDeviceId
        this.selfieDeviceId = selfieDeviceId
        this.selectedDevice(this.environmentDeviceId || this.selfieDeviceId)
      } else {
        const deviceId = await this.findCamera(CameryType.ANY)
        if (deviceId) {
          this.environmentDeviceId = deviceId
          this.selfieDeviceId = undefined
          this.selectedDevice(this.environmentDeviceId)
        } else {
          // No camera detected
          this.environmentDeviceId = undefined
          this.selfieDeviceId = undefined
          this.selectedDevice(undefined)
          Analytics.logEvent(Analytics.AnalyticsEventType.CAMERA, 'failed', 'camera lookup', { message: 'No camera detected.' }, Analytics.LogLevel.DEBUG)
          this.setFailed('Hittade ingen lämplig kamera')
        }
      }
      Analytics.logEvent(Analytics.AnalyticsEventType.CAMERA, 'list', 'camera lookup', {
        environmentDeviceId: this.environmentDeviceId,
        selfieDeviceId: this.selfieDeviceId,
        selectedDeviceId: this._selectedDeviceId
      }, Analytics.LogLevel.DEBUG)
    } catch (e: any) {
      Analytics.logEvent(Analytics.AnalyticsEventType.CAMERA, 'failed', 'camera lookup', e, Analytics.LogLevel.DEBUG)
      this.setFailed('Ett oväntat problem uppstod')
    }
  }

  stopCamera() {
    const cam: any = this.$refs.webcam
    if (cam) {
      cam.stop()
    }
  }

  getCameraConstraints({ deviceId = '', cameraType = CameryType.ANY }: { deviceId?: string, cameraType?: CameryType }): any {
    const video: any = {
      width: 1280,
      height: 720
    }
    if (deviceId) {
      video.deviceId = { exact: deviceId }
    }
    if (cameraType !== CameryType.ANY) {
      video.facingMode = cameraType === CameryType.USER ? 'user' : 'environment'
    }
    return {
      video
    }
  }

  startCamera(deviceId: any) {
    this.state = State.STARTING
    Analytics.logEvent(Analytics.AnalyticsEventType.CAMERA, 'set', 'camera', { deviceId }, Analytics.LogLevel.INFO)

    this.stopCamera()

    const constraints = this.getCameraConstraints({ deviceId })
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream: any) => {
        const cam: any = this.$refs.webcam
        if (cam) {
          cam.loadSrcStream(stream)
        }
      })
      .catch((error: any) => {
        const { code, message, name } = error
        Analytics.logEvent(Analytics.AnalyticsEventType.CAMERA, 'failed', 'camera', { error: JSON.stringify(error), code, message, name }, Analytics.LogLevel.DEBUG)
        this.setFailed(this.translateGetUserMediaError(String(name)))
        this.$emit("error", error)
      });
  }
}
</script>

<style scoped>
.container {
  /* display: flex; */
  height: 100%;
  width: 100%;
}
.container .state {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
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
.container.state-init video,
.container.state-checking video,
.container.state-failed video {
  visibility: hidden;
}
</style>
