<template>
  <div class="fullscreen">
    <div class="background" />
    <div class="content">
      <div
        class="top-buttons"
        v-if="isCloseEventListenerDefined"
      >
        <IconButton
          @click="onClose"
          icon="close"
          type="secondary"
        />
      </div>
      <slot name="default" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Emit } from 'vue-property-decorator'
import IconButton from '@/components/common/IconButton.vue'

@Component({
  components: { IconButton }
})
export default class Fullscreen extends Vue {
  get isCloseEventListenerDefined() {
    return this.$listeners && this.$listeners.close
  }

  @Emit('close')
  onClose() {
    return true
  }
}
</script>

<style scoped>
.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  z-index: 1001;
}

.fullscreen > .background {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;

  background-color: rgba(0, 0, 0, 0.5);
}

.fullscreen > .content {
  position: absolute;
  top: 10px;
  left: 10px;
  bottom: 10px;
  right: 10px;

  overflow: scroll;

  /* Theme from tunnelbanejakten.se: */
  background-color: #fff;
  border: 1px solid #738489;
}

.fullscreen > .content > .top-buttons {
  position: absolute;
  top: 10px;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  width: 100%;
  right: 10px;
  z-index: 1001;
}
</style>
