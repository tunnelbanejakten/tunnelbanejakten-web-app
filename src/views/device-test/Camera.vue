<template>
  <div>
    <p>Flera uppgifter under tävlingen besvaras med foton.</p>
    <Button
      label="Okej, ta en bild"
      @click="onStartTest"
    />
    <Fullscreen v-if="isCameraShown">
      <div class="camera-container">
        <div class="camera">
          <CameraComponent @captured="onCaptured" />
        </div>
        <div class="buttons">
          <Button
            label="Stäng"
            @click="onEndTest"
            type="secondary"
          />
        </div>
      </div>
      <div
        v-if="!!img"
        class="review"
      >
        <p>Blev bilden bra?</p>
        <div>
          <img
            :src="img"
            class="captured-photo"
          >
        </div>
        <div>
          <Button
            label="Ja"
            @click="onAcceptPhoto"
          />
        </div>
        <div>
          <Button
            label="Nej, ta en ny"
            @click="onRejectPhoto"
            type="secondary"
          />
        </div>
      </div>
    </Fullscreen>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Button from '@/components/common/Button.vue'
import Fullscreen from '@/components/common/Fullscreen.vue'
import CameraComponent from '@/components/common/Camera.vue'
import store, { Status } from '@/store'

@Component({
  components: {
    Button,
    Fullscreen,
    CameraComponent
  }
})
export default class Camera extends Vue {
  private isCameraShown = false;

  private img? = '';

  onStartTest () {
    this.isCameraShown = true
    this.img = ''
    // this.start()
  }

  onEndTest () {
    this.isCameraShown = false
  }

  onCaptured (event: string) {
    this.img = event
  }

  onRejectPhoto () {
    this.img = ''
    // this.start()
  }

  onAcceptPhoto () {
    store.setDeviceTestStatus('camera', Status.SUCCESS)
    this.onEndTest()
  }
}
</script>

<style scoped>
.camera-container {
  /* display: flex; */
}
.camera-container .camera {
  /* flex: 1; */
}
.camera-container .buttons {
  position: absolute;
  top: 10px;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  width: 100%;
  right: 10px;
}
.camera-container .buttons button {
  margin-left: 10px;
}
.camera-container .buttons button:first-child {
  margin-left: 0px;
}

.captured-photo {
  border: 10px solid white;
  box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.2);
  width: 300px;
  height: auto;
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
