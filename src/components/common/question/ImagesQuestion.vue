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
        :question-id="questionId"
        :field-name="fieldName"
        @image-removed="onImageRemoved"
      />

      <ImagesQuestionUploader
        v-if="isAdditionalImageAllowed"
        :question-id="questionId"
        :field-name="fieldName"
        @image-uploaded="onImageUploaded"
        @upload-started="onImageUploadStarted"
        @upload-failed="onImageUploadFailed"
        :select-button-label="selectButtonLabel"
        :optimistic-lock-value="optimisticLockValue"
      />
    </div>
    <div class="file-count-status">
      {{ fileCountStatus }}
    </div>
    <div class="input-wrapper">
      <input
        placeholder="Skriv kommentar här, om det behövs..."
        type="text"
        :value="commentFieldValue"
        :name="commentFieldName"
      >
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import Page from '@/components/layout/Page.vue'
import Wrapper from './Question.vue'
import ConfirmationOverlay from '@/components/common/ConfirmationOverlay.vue'
import Fullscreen from '@/components/common/Fullscreen.vue'
import Button from '@/components/common/Button.vue'
import Camera from '@/components/common/Camera.vue'
import Message, { Type as MessageType } from '@/components/common/Message.vue'
import { QuestionDto } from './model'
import ImagesQuestionImage from './ImagesQuestionImage.vue'
import ImagesQuestionUploader from './ImagesQuestionUploader.vue'

export type ImageData = {
  imageId: string
  thumbnailUrl: string
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
  @Prop() private question!: QuestionDto;
  @Prop() private questionId!: string;
  @Prop() private optimisticLockValue!: string;

  private statusHeader = ''
  private statusMessage = ''
  private statusType: MessageType = MessageType.FAILURE

  private imageList: ImageData[] = []

  created() {
    if (this.currentResponse) {
      const images = this.currentResponse.images || []
      const thumbnails = this.currentResponse.thumbnails || []
      this.imageList = images.map((imageId: string, index: number) => ({ imageId, thumbnailUrl: thumbnails[index] }))
    }
  }

  get fieldName() {
    return this.question.response.field_name + '[images][]'
  }

  get commentFieldName() {
    return this.question.response.field_name + '[comment]'
  }

  get commentFieldValue() {
    return this.question?.response.current_value?.comment
  }

  get currentResponse() {
    return this.question?.response.current_value
  }

  get isAdditionalImageAllowed() {
    return this.imageList.length < this.maxImageCount
  }

  get maxImageCount(): number {
    return this.question.config?.max_files_count
  }

  onImageUploaded(imageData: ImageData) {
    this.imageList.push(imageData)
    this.statusMessage = ''
  }

  onImageUploadStarted() {
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
        ? ('Ni kan ladda upp COUNT IMAGES här.'
          .replace('COUNT', String(this.maxImageCount))
          .replace('IMAGES', this.plural(this.maxImageCount, 'bilder', 'bild', 'bilder')))
        : ('Ni kan ladda upp COUNT IMAGES till.'
          .replace('COUNT', String(this.maxImageCount - count))
          .replace('IMAGES', this.plural(this.maxImageCount - count, 'bilder', 'bild', 'bilder')))
      return pattern
    } else {
      if (this.maxImageCount > 1) {
        return 'Ni har laddad upp så många bilder som ni får. Vill ni byta ut en bild måste ni först ta bort en.'
      } else {
        return 'Vill ni byta ut bilden måste ni först ta bort den ni laddat upp.'
      }
    }
  }

  get selectButtonLabel() {
    if (this.imageList.length) {
      return 'Ta bild...'
    } else {
      return 'Ta bild med kamera...'
    }
  }
}
</script>

<style scoped>
.images-container {
  display: flex;
  justify-content: center;
}
.file-count-status {
  font-size: 90%;
  font-style: italic;
}
input {
  box-sizing: border-box;
  width: 100%;
  margin: 15px 0px 5px 0px;
  padding: 5px;
  border: 1px solid #bbb;

  font: 16px/1.4 "Open Sans", Tahoma, Verdana, Segoe, sans-serif;
}
</style>
