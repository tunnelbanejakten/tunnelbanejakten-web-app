<template>
  <div class="wrapper">
    <div
      v-if="!isUploading"
      class="mode-select"
    >
      <Button
        :label="selectButtonLabel"
        type="primary"
        @click="onStartCamera"
      />
      <Fullscreen
        v-if="isCameraShown"
        @close="onStopCamera"
      >
        <div class="camera-container">
          <div class="camera">
            <Camera @captured="onCaptured" />
          </div>
        </div>
        <div
          v-if="!!imageDataUrl"
          class="review"
        >
          <img
            :src="imageDataUrl"
            class="captured-photo"
          >
          <ConfirmationOverlay
            question="Blev bilden bra?"
            accept-label="Ja"
            @accept="onAcceptPhoto"
            reject-label="Nej"
            @reject="onRejectPhoto"
          />
        </div>
      </Fullscreen>
    </div>
    <div
      v-if="isUploading"
      class="mode-uploading"
    >
      <Loader />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit } from 'vue-property-decorator'
import { ImageData } from './ImagesQuestion.vue'
import ConfirmationOverlay from '@/components/common/ConfirmationOverlay.vue'
import Fullscreen from '@/components/common/Fullscreen.vue'
import Button from '@/components/common/Button.vue'
import Loader from '@/components/common/Loader.vue'
import Camera from '@/components/common/Camera.vue'
import * as AuthUtils from '@/utils/Auth'

const apiHost = process.env.VUE_APP_API_HOST

@Component({
  components: {
    Button,
    Loader,
    Camera,
    Fullscreen,
    ConfirmationOverlay
  }
})
export default class ImagesQuestionImage extends Vue {
  @Prop() private selectButtonLabel!: string
  @Prop() private questionId!: string
  @Prop() private fieldName!: string
  @Prop() private optimisticLockValue!: string
  private isUploading = false
  private imageDataUrl = '';
  private isCameraShown = false;

  // Credits: https://stackoverflow.com/a/5100158
  dataURItoBlob(dataURI: string) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    let byteString
    if (dataURI.split(',')[0].indexOf('base64') >= 0) {
      byteString = atob(dataURI.split(',')[1])
    } else {
      byteString = unescape(dataURI.split(',')[1])
    }
    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length)
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i)
    }

    return new Blob([ia], { type: mimeString })
  }

  async uploadImageFromDataUrl(imageUrl: string) {
    var blob = this.dataURItoBlob(imageUrl)
    var fd = new FormData(document.createElement('form'))
    fd.append('action', 'tuja_upload_images')
    const token = AuthUtils.getTokenCookie()
    if (token) {
      fd.append('token', token)
    }
    fd.append('question', this.questionId)
    fd.append('lock', this.optimisticLockValue)
    fd.append('file', blob, 'image.jpg')

    this.isUploading = true
    try {
      const resp = await fetch(
        `${apiHost}/wp-admin/admin-ajax.php`,
        {
          method: 'POST',
          body: fd
        }
      )
      if (resp.ok) {
        const payload = await resp.json()
        this.onImageUploaded({
          imageId: payload.image,
          thumbnailUrl: payload.thumbnail_url
        })
        console.log('Response', payload)
      } else {
        console.log('Non-ok response', resp.status)
      }
    } catch (e) {
      console.log('💥', e)
    }
    this.isUploading = false
  }

  onStartCamera() {
    this.isCameraShown = true
    this.imageDataUrl = ''
  }

  onStopCamera() {
    this.isCameraShown = false
  }

  onCaptured(event: string) {
    this.imageDataUrl = event
  }

  onRejectPhoto() {
    this.imageDataUrl = ''
  }

  async onAcceptPhoto() {
    this.isCameraShown = false
    await this.uploadImageFromDataUrl(this.imageDataUrl)
  }

  @Emit('image-uploaded')
  onImageUploaded(imageData: ImageData) {
    return imageData
  }
}

</script>

<style scoped>
.wrapper {
  width: 40vw;
  height: 40vw;
  overflow: hidden;
}
.thumbnail {
  width: 40vw;
  height: 40vw;
  object-fit: contain;
}
.mode-select {
  display: flex;
  width: 40vw;
  height: 40vw;
  justify-content: center;
  align-items: center;
}
.mode-uploading {
  display: flex;
  width: 40vw;
  height: 40vw;
  justify-content: center;
  align-items: center;
}
.mode-uploaded {
  position: relative;
}
.thumbnail-overlay-buttons {
  position: absolute;
  bottom: 10px;
  width: 100%;
  display: flex;
  justify-content: center;
}
.camera-container .buttons button {
  margin-left: 10px;
}
.camera-container .buttons button:first-child {
  margin-left: 0px;
}

.captured-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.review {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
