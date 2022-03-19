<template>
  <div>
    <Message
      v-if="!!statusMessage"
      :header="statusHeader"
      :message="statusMessage"
      :type="statusType"
    />
    <div class="images-container">
      <ImagesQuestionImage
        v-for="data in imageList"
        :key="data.imageId"
        :image-data="data"
        :read-only="readOnly"
        @image-removed="onImageRemoved"
      />

      <ImagesQuestionUploader
        v-if="isAdditionalImageAllowed"
        @image-captured="onImageCaptured"
        @image-error="onImageUploadFailed"
        :max-file-size="maxFileSize"
      />
    </div>
    <div
      class="file-count-status"
      v-if="!readOnly"
    >
      {{ fileCountStatus }}
    </div>
    <div class="input-wrapper">
      <input
        placeholder="Skriv kommentar här, om det behövs..."
        type="text"
        :readonly="readOnly"
        :disabled="readOnly"
        v-model="commentFieldValue"
      >
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit } from 'vue-property-decorator'
import Page from '@/components/layout/Page.vue'
import Wrapper from './Question.vue'
import ConfirmationOverlay from '@/components/common/ConfirmationOverlay.vue'
import Fullscreen from '@/components/common/Fullscreen.vue'
import Button from '@/components/common/Button.vue'
import Camera from '@/components/common/Camera.vue'
import Message, { Type as MessageType } from '@/components/common/Message.vue'
import { FormUpdate, QuestionResponseDto } from './model'
import ImagesQuestionImage from './ImagesQuestionImage.vue'
import ImagesQuestionUploader from './ImagesQuestionUploader.vue'
import store from '@/store'

export type ImageData = {
  imageId: string
  thumbnailUrl: string
  dataUrl?: string
}

@Component({
  components: {
    Page,
    Wrapper,
    Button,
    Camera,
    Fullscreen,
    Message,
    ConfirmationOverlay,
    ImagesQuestionImage,
    ImagesQuestionUploader
  }
})
export default class ImageQuestion extends Vue {
  @Prop() private questionResponse!: QuestionResponseDto;
  @Prop() private questionConfig!: any;
  @Prop() private questionId!: string;
  @Prop() private readOnly!: boolean;

  private statusHeader = ''
  private statusMessage = ''
  private statusType: MessageType = MessageType.FAILURE
  private imageList: ImageData[] = []
  private commentFieldValue: string = ''

  created() {
    if (this.currentResponse) {
      const images = this.currentResponse.images || []
      const thumbnails = this.currentResponse.thumbnails || []
      this.imageList = images.map((imageId: string, index: number) => ({ imageId, thumbnailUrl: thumbnails[index] }))
      this.commentFieldValue = this.currentResponse.comment
    } else {
      this.imageList = []
      this.commentFieldValue = ''
    }
    this.$watch('imageList', this.onChange)
    this.$watch('commentFieldValue', this.onChange)
  }

  get fieldName() {
    return this.questionResponse.field_name + '[images][]'
  }

  get commentFieldName() {
    return this.questionResponse.field_name + '[comment]'
  }

  get currentResponse() {
    return this.questionResponse?.current_value
  }

  get isAdditionalImageAllowed() {
    return this.imageList.length < this.maxImageCount && !this.readOnly
  }

  get maxImageCount(): number {
    return this.questionConfig?.max_files_count
  }

  // The upper limit for uploads is MAX_FILE_SIZE, unless the question explicitly specifies a lower value.
  get maxFileSize(): number {
    const configuredMaxFileSize = store.state.configuration.uploads.maxFileSize
    const defaultMaxFileSize = parseInt(process.env.VUE_APP_MAX_FILE_SIZE || '5000000', 10)
    // Upper bound for file size (if not overridden by individual question):
    const overallMaxFileSize = configuredMaxFileSize ? configuredMaxFileSize * 1e6 : defaultMaxFileSize

    const questionSpecificLimit = this.questionConfig?.max_file_size
    if (questionSpecificLimit) {
      return Math.min(questionSpecificLimit, overallMaxFileSize)
    } else {
      return overallMaxFileSize
    }
  }

  @Emit('change')
  onChange() {
    return {
      updatedFields: [{
        key: this.commentFieldName,
        value: this.commentFieldValue
      }].concat(this.imageList.map(({ imageId }) => ({
        key: this.fieldName,
        value: imageId
      })))
    } as FormUpdate
  }

  onImageCaptured(dataUrl: string) {
    this.imageList.push({
      imageId: dataUrl,
      thumbnailUrl: dataUrl,
      dataUrl: dataUrl
    })
    this.statusMessage = ''
  }

  onImageUploadFailed(error: any) {
    this.statusHeader = 'Oj då'
    this.statusMessage = error.message
  }

  onImageRemoved(imageData: ImageData) {
    const index = this.imageList.findIndex((o: ImageData) => o.imageId === imageData.imageId)
    if (index !== -1) {
      this.imageList.splice(index, 1)
    }
    this.statusMessage = ''
  }

  plural(number: number, zero: string, one: string, other: string) {
    switch (number) {
      case 0:
        return zero
      case 1:
        return one
      default:
        return other
    }
  }

  get fileCountStatus() {
    if (this.isAdditionalImageAllowed) {
      var count = this.imageList.length
      var pattern = count === 0
        ? ('Ni kan ladda upp COUNT IMAGES.'
          .replace('COUNT', String(this.maxImageCount))
          .replace('IMAGES', this.plural(this.maxImageCount, 'bilder', 'bild', 'bilder')))
        : ('Ni kan ladda upp COUNT IMAGES till.'
          .replace('COUNT', String(this.maxImageCount - count))
          .replace('IMAGES', this.plural(this.maxImageCount - count, 'bilder', 'bild', 'bilder')))
      return pattern
    } else {
      if (this.maxImageCount > 1) {
        return 'Byta ut bild? Ta bort en först.'
      } else {
        return 'Byta ut bilden? Ta bort den ni har först.'
      }
    }
  }
}
</script>

<style scoped>
.images-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-wrap: wrap;
}
.images-container::v-deep .thumbnail,
.images-container::v-deep .wrapper,
.images-container::v-deep .mode-uploaded,
.images-container::v-deep .mode-uploading,
.images-container::v-deep .mode-select {
  width: 60vw;
  height: 60vw;
}
.images-container::v-deep .wrapper {
  overflow: hidden;
  margin: 0 10px 10px 0;
}
@media (min-width: 375px) {
  .images-container {
    display: flex;
    justify-content: flex-start;
    flex-direction: row;
    flex-wrap: wrap;
  }
  .images-container::v-deep .thumbnail,
  .images-container::v-deep .wrapper,
  .images-container::v-deep .mode-uploaded,
  .images-container::v-deep .mode-uploading,
  .images-container::v-deep .mode-select {
    width: 39vw;
    height: 39vw;
    max-width: 300px;
    max-height: 300px;
  }
}
.file-count-status {
  font-size: 90%;
  font-style: italic;
}
input {
  box-sizing: border-box;
  width: 100%;
  margin: 15px 0px 5px 0px;
  padding: 10px;
  border: 1px solid #bbb;
  border-radius: 5px;

  font: 16px/1.4 "Open Sans", Tahoma, Verdana, Segoe, sans-serif;
}
</style>
