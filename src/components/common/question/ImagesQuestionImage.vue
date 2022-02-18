<template>
  <div class="wrapper">
    <div class="mode-uploaded">
      <img
        class="thumbnail"
        :src="imageData.thumbnailUrl"
        alt="Miniatyr av uppladdad bild"
      >

      <div
        class="thumbnail-overlay-buttons"
        v-if="!readOnly"
      >
        <IconButton
          @click="onImageRemoved"
          icon="trash"
          size="normal"
          type="secondary"
        />
      </div>

      <div class="input-wrapper">
        <input
          type="hidden"
          :value="imageData.imageId"
          :name="fieldName"
        >
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit } from 'vue-property-decorator'
import { ImageData } from './ImagesQuestion.vue'
import ConfirmationOverlay from '@/components/common/ConfirmationOverlay.vue'
import Fullscreen from '@/components/common/Fullscreen.vue'
import IconButton from '@/components/common/IconButton.vue'
import Loader from '@/components/common/Loader.vue'
import Camera from '@/components/common/Camera.vue'

@Component({
  components: {
    IconButton,
    Loader,
    Camera,
    Fullscreen,
    ConfirmationOverlay
  }
})
export default class ImagesQuestionImage extends Vue {
  @Prop() private imageData!: ImageData
  @Prop() private fieldName!: string
  @Prop() private readOnly!: boolean

  @Emit('image-removed')
  onImageRemoved() {
    return this.imageData
  }
}

</script>

<style scoped>
.thumbnail {
  display: block;
  object-fit: cover;
  background-color: #eee;
  border-radius: 10px;
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
</style>
