<template>
  <div>
    <div class="images-container">
      <ImagesQuestionImage
        v-for="data in imageList"
        :key="data.imageId"
        :image-data="data"
        :question-id="questionId"
        :field-name="fieldName"
        @image-removed="onImageRemoved"
      />

      <ImagesQuestionImage
        v-if="isAdditionalImageAllowed"
        :question-id="questionId"
        :field-name="fieldName"
        @image-uploaded="onImageUploaded"
        :select-button-label="selectButtonLabel"
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
import { QuestionDto } from './model'
import ImagesQuestionImage, { ImageData } from './ImagesQuestionImage.vue'

@Component({
  components: {
    Page,
    Wrapper,
    Button,
    Camera,
    Fullscreen,
    ConfirmationOverlay,
    ImagesQuestionImage
  }
})
export default class ImageQuestion extends Vue {
  @Prop() private question!: QuestionDto;
  @Prop() private questionId!: string;

  get fieldName() {
    return this.question.response.field_name + '[images][]'
  }

  get commentFieldName() {
    return this.question.response.field_name + '[comment]'
  }

  get commentFieldValue() {
    return this.question?.response.current_value.comment
  }

  get imageList(): ImageData[] {
    const images = this.question?.response.current_value.images || []
    const thumbnails = this.question?.response.current_value.thumbnails || []
    return images.map((imageId: string, index: number) => ({ imageId, thumbnailUrl: thumbnails[index] }))
  }

  get isAdditionalImageAllowed() {
    return this.imageList.length < this.maxImageCount
  }

  get maxImageCount(): number {
    return this.question.config?.max_files_count
  }

  onImageUploaded(imageData: ImageData) {
    const images = this.question?.response.current_value.images
    const thumbnails = this.question?.response.current_value.thumbnails
    console.log(imageData, images, thumbnails)
    if (images) {
      images.push(imageData.imageId)
    }
    if (thumbnails) {
      thumbnails.push(imageData.thumbnailUrl)
    }
  }

  onImageRemoved(imageData: ImageData) {
    const images = this.question?.response.current_value.images
    const thumbnails = this.question?.response.current_value.thumbnails
    const index = images.findIndex((existingId: string) => existingId === imageData.imageId)
    if (index !== -1) {
      images.splice(index, 1)
      thumbnails.splice(index, 1)
    }
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
      return 'Ta bild'
    } else {
      return 'Ta er första bild'
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
