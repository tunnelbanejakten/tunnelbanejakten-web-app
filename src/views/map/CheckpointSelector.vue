<template>
  <div class="arrival-container">
    <div>Du är framme!</div>
    <div
      v-for="marker in markers"
      :key="marker.label"
    >
      <Button
        :label="marker.label"
        @click="onClickMarker(marker)"
        :size="checkpointButtonSize"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit } from 'vue-property-decorator'
import Button, { Size as ButtonSize } from '@/components/common/Button.vue'
import {
  Marker
} from '@/components/common/Map.vue'

@Component({
  components: {
    Button
  }
})
export default class CheckpointSelector extends Vue {
  @Prop() private markers!: Marker[];

  private checkpointButtonSize: ButtonSize = ButtonSize.HUGE;

  @Emit('selected')
  onClickMarker(e: Marker) {
    return e
  }
}
</script>

<style scoped>
</style>
