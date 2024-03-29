<template>
  <div class="wrapper">
    <div
      v-if="!isUploading"
      class="mode-select"
    >
      <div>
        Lägg till bild:
      </div>
      <Button
        label="Kamera"
        icon="camera"
        type="primary"
        @click="onStartCamera"
      />
      <Button
        label="Välj bild"
        icon="image"
        type="primary"
        @click="onStartFileSelector"
      />
      <input
        type="file"
        ref="fileSelector"
        style="display: none"
        @change="onFileSelected"
        accept="image/*"
      >
      <Fullscreen
        v-if="isCameraShown"
        @close="onStopCamera"
      >
        <div class="camera-container">
          <Camera @captured="onCaptured" />
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
import * as Analytics from '@/utils/Analytics'
import { ImageData } from './ImagesQuestion.vue'
import ConfirmationOverlay from '@/components/common/ConfirmationOverlay.vue'
import Fullscreen from '@/components/common/Fullscreen.vue'
import Button from '@/components/common/Button.vue'
import Loader from '@/components/common/Loader.vue'
import Camera from '@/components/common/Camera.vue'
import * as AuthUtils from '@/utils/Auth'
import * as Api from '@/utils/Api'

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
  @Prop() private maxFileSize!: number
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
    let dataUrl = null
    for (const resizeFactor of [1.0, 0.5, 0.25]) {
      let resizedDataUrl = ''
      try {
        resizedDataUrl = await this.resizeImage(imageUrl, resizeFactor)
      } catch (error: any) {
        this.onImageError('Kunde inte förminska bilden.', 'image downscaling', {
          message: `Failed to resize image. Factor: ${resizeFactor}. Base64-encoded length: ${imageUrl.length}. Error: ${error.message}.`
        })
        return
      }
      const tempBlob = this.dataURItoBlob(resizedDataUrl)
      if (!tempBlob) {
        this.onImageError('Kunde inte läsa in bilden.', 'image downscaling', {
          message: `Failed to convert data URI to blob. Base64-encoded length: ${imageUrl.length}. Start of base64-encoded content: ${imageUrl.substring(0, 30)}`
        })
        return
      }

      if (tempBlob.size < this.maxFileSize) {
        dataUrl = resizedDataUrl
        break
      }
    }

    if (!dataUrl) {
      this.onImageError('Kunde inte spara bilden trots flera försök.', 'image upload', {
        message: `Failed to convert data URI to blob. Base64-encoded length: ${imageUrl.length}. Start of base64-encoded content: ${imageUrl.substring(0, 30)}`
      })
      return
    }

    this.onImageCaptured(dataUrl)
  }

  @Emit('image-captured')
  onImageCaptured(dataUrl: string) {
    return dataUrl
  }

  // Credits: https://www.therogerlab.com/sandbox/pages/how-to-resize-an-image-using-javascript
  resizeImage(imageUrl: string, resizeFactor: number): Promise<string> {
    if (resizeFactor === 1.0) {
      return Promise.resolve(imageUrl)
    }
    Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'downscaling', 'image upload', {
      size: resizeFactor,
      message: `Resizing image. Factor: ${resizeFactor}. Base64-encoded length: ${imageUrl.length}.`
    })
    return new Promise((resolve, reject) => {
      console.log('🏞 Starting promise')

      const sourceImage = new Image()
      sourceImage.onload = (event: any) => {
        try {
          console.log('🏞 Source image loaded')
          const { height, width } = event.target
          const targetCanvas = document.createElement('canvas')
          targetCanvas.width = resizeFactor * width
          targetCanvas.height = resizeFactor * height

          const targetCtx = targetCanvas.getContext('2d')
          if (targetCtx) {
            targetCtx.drawImage(event.target, 0, 0, targetCanvas.width, targetCanvas.height)

            const newDataUrl = targetCtx?.canvas.toDataURL('image/jpeg', 1.0)
            console.log(`🏞 Got a data URL. Length: ${newDataUrl.length}.`)
            Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'downscaled', 'image upload', {
              message: `Length of resized base64-encoded image: ${newDataUrl.length}.`
            })
            resolve(newDataUrl)
          } else {
            console.log('🏞 No context')
            reject(new Error('No context.'))
          }
        } catch (e: any) {
          console.log('🏞 Something went wrong', e)
          reject(e)
        }
      }
      sourceImage.src = imageUrl
    })
  }

  onStartFileSelector() {
    (this.$refs.fileSelector as HTMLInputElement).click()
  }

  onFileSelected(event: any) {
    const files = (event.target as HTMLInputElement).files
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'selected', 'image upload', {
          message: 'User selected file to upload'
        })

        const reader = new FileReader()
        reader.onload = (event) => {
          const result = event?.target?.result
          if (result) {
            this.uploadImageFromDataUrl(result as string)
          } else {
            this.onImageError('Kunde inte öppna bilden.', 'image upload', {
              message: 'Reader loaded by no data'
            })
          }
        }
        reader.readAsDataURL(file)
      }
    } else {
      Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'skipped', 'image upload', {
        message: 'No files selected'
      })
    }
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

  @Emit('image-error')
  onImageError(userErrorMessage: string, analyticsEventObject: string, analyticsProps: any) {
    this.isUploading = false

    Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'failed', analyticsEventObject, analyticsProps)

    return new Error(userErrorMessage)
  }
}

</script>

<style scoped>
.mode-select {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  background-color: #eee;
  border-radius: 10px;
}
.mode-uploading {
  display: flex;
  justify-content: center;
  align-items: center;
}
.mode-uploaded {
  position: relative;
}
.camera-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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
  object-fit: contain;
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
