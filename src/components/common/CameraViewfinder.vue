<template>
  <video
    ref="video"
    height="100%"
    width="100%"
    :src="source"
    :autoplay="true"
    :playsinline="true"
  />
</template>

<script lang="ts">
// Copied and adapted from https://github.com/VinceG/vue-web-cam/blob/master/src/webcam.vue
import { Component, Vue } from 'vue-property-decorator'

@Component({
  components: {
  }
})
export default class CameraViewfinder extends Vue {
  private source: String | null = null
  private ctx: any = null
  private canvas: any = null

  beforeDestroy() {
    this.stop()
  }

  loadSrcStream(stream: any) {
    this.stop()
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

  stop() {
    const videoElement: any = this.$refs.video
    if (videoElement && videoElement.srcObject) {
      this.stopStreamedVideo(videoElement);
    }
  }

  // start() {
  //   if (this.deviceId) {
  //     this.loadCamera(this.deviceId);
  //   }
  // }

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

  capture() {
    return this.getCanvas().toDataURL("image/jpeg");
  }

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

<style scoped>
video {
  object-fit: cover;
}
</style>