<template>
  <video
    ref="video"
    :width="width"
    :height="height"
    :src="source"
    :autoplay="true"
    :playsinline="true"
  />
</template>

<script lang="ts">
// This is a copy of https://github.com/VinceG/vue-web-cam/blob/master/src/webcam.vue
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
@Component({
  components: {

  }
})
export default class CameraViewfinder extends Vue {
  @Prop({ default: "100%" }) width!: Number
  @Prop({ default: 500 }) height!: Number
  @Prop({ default: "image/jpeg" }) screenshotFormat!: String
  @Prop({ default: false }) selectFirstDevice!: Boolean
  @Prop({ default: null }) deviceId!: String
  @Prop({ default: null }) resolution!: any

  private source: String | null = null
  private ctx: any = null
  private canvas: any = null
  private camerasListEmitted: boolean = false
  private cameras: any[] = []

  @Watch('deviceId')
  onDeviceIdChange(id: string) {
    this.changeCamera(id);
  }

  mounted() {
    this.setupMedia()
  }

  beforeDestroy() {
    this.stop()
  }

  /**
   * get user media
   */
  legacyGetUserMediaSupport() {
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

  /**
   * setup media
   */
  setupMedia() {
    const legacyNavigator: any = navigator
    if (legacyNavigator.mediaDevices === undefined) {
      legacyNavigator.mediaDevices = {};
    }

    if (legacyNavigator.mediaDevices.getUserMedia === undefined) {
      legacyNavigator.mediaDevices.getUserMedia = this.legacyGetUserMediaSupport();
    }

    this.testMediaAccess();
  }

  /**
   * load available cameras
   */
  loadCameras() {
    navigator.mediaDevices
      .enumerateDevices()
      .then(deviceInfos => {
        for (let i = 0; i !== deviceInfos.length; ++i) {
          let deviceInfo = deviceInfos[i];
          if (deviceInfo.kind === "videoinput") {
            this.cameras.push(deviceInfo);
          }
        }
      })
      .then(() => {
        if (!this.camerasListEmitted) {
          if (this.selectFirstDevice && this.cameras.length > 0) {
            this.deviceId = this.cameras[0].deviceId;
          }

          this.$emit("cameras", this.cameras);
          this.camerasListEmitted = true;
        }
      })
      .catch((error: Error) => this.$emit("notsupported", error));
  }

  /**
   * change to a different camera stream, like front and back camera on phones
   */
  changeCamera(deviceId: string) {
    this.stop();
    this.$emit("camera-change", deviceId);
    this.loadCamera(deviceId);
  }

  /**
   * load the stream to the
   */
  loadSrcStream(stream: any) {
    const videoElement: any = this.$refs.video
    if ("srcObject" in videoElement) {
      // new browsers api
      videoElement.srcObject = stream;
    } else {
      // old broswers
      // @ts-ignore
      this.source = window.HTMLMediaElement.srcObject(stream);
    }
    // Emit video start/live event
    videoElement.onloadedmetadata = () => {
      this.$emit("video-live", stream);
    };

    this.$emit("started", stream);
  }

  /**
   * stop the selected streamed video to change camera
   */
  stopStreamedVideo(videoElem: any) {
    let stream = videoElem.srcObject;
    let tracks = stream.getTracks();

    tracks.forEach((track: any) => {
      // stops the video track
      track.stop();
      this.$emit("stopped", stream);

      (this.$refs.video as HTMLVideoElement).srcObject = null;
      this.source = null;
    });
  }

  // stop the video
  stop() {
    const videoElement: any = this.$refs.video
    if (videoElement && videoElement.srcObject) {
      this.stopStreamedVideo(videoElement);
    }
  }

  // start the video
  start() {
    if (this.deviceId) {
      this.loadCamera(this.deviceId);
    }
  }

  // pause the video
  pause() {
    const videoElement: any = this.$refs.video
    if (videoElement && videoElement.srcObject) {
      videoElement.pause();
    }
  }

  // resume the video
  resume() {
    const videoElement: any = this.$refs.video
    if (videoElement && videoElement.srcObject) {
      videoElement.play();
    }
  }

  /**
   * test access
   */
  testMediaAccess() {
    let constraints: any = { video: true };

    if (this.resolution) {
      constraints.video = {};
      constraints.video.height = this.resolution.height;
      constraints.video.width = this.resolution.width;
    }

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(stream => {
        //Make sure to stop this MediaStream
        let tracks = stream.getTracks();
        tracks.forEach(track => {
          track.stop();
        });
        this.loadCameras();
      })
      .catch((error: Error) => this.$emit("error", error));
  }

  /**
   * load the camera passed as index!
   */
  loadCamera(device: any) {
    const constraints: any = { video: { deviceId: { exact: device } } };

    if (this.resolution) {
      constraints.video.height = this.resolution.height;
      constraints.video.width = this.resolution.width;
    }

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream: any) => this.loadSrcStream(stream))
      .catch((error: Error) => this.$emit("error", error));
  }

  /**
   * capture screenshot
   */
  capture() {
    return this.getCanvas().toDataURL(this.screenshotFormat);
  }

  /**
   * get canvas
   */
  getCanvas() {
    const video: any = this.$refs.video;
    if (video && !this.ctx) {
      const canvas: any = document.createElement("canvas");
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      this.canvas = canvas;

      this.ctx = canvas.getContext("2d");
    }

    const { ctx, canvas } = this;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas;
  }
}
</script>