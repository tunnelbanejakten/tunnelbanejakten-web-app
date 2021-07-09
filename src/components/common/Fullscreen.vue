<template>
  <div class="fullscreen">
    <div class="background" />
    <div class="content">
      <div class="top-buttons">
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
  z-index: 1;
}

.background {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;

  background-color: rgba(255, 255, 255, 0.5);
}
.content {
  position: absolute;
  top: 20px;
  left: 20px;
  bottom: 20px;
  right: 20px;

  overflow: scroll;

  /* Theme from tunnelbanejakten.se: */
  background-color: #fff;
  border: 1px solid #738489;
  /* border-radius: 20px; */

  box-shadow: 0px 0 20px 0px rgb(0 0 0 / 75%);
  -webkit-box-shadow: 0px 0 20px 0px rgb(0 0 0 / 75%);
  -moz-box-shadow: 0px 0 20px 0px rgb(0 0 0 / 75%);
}
.top-buttons {
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
