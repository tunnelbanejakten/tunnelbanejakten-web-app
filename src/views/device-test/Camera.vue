<template>
  <div>
    <p>Flera uppgifter under tävlingen besvaras med foton.</p>
    <Button
      :label="startTestButtonLabel"
      :type="startTestButtonType"
      size="huge"
      @click="onStartTest"
    />
    <Fullscreen v-if="isCameraShown" @close="onEndTest">
      <div class="camera-container">
        <div class="camera">
          <CameraComponent @captured="onCaptured" />
        </div>
        </div>
      <div v-if="!!img" class="review">
        <img :src="img" class="captured-photo" />
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
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Button from "@/components/common/Button.vue";
import IconButton from "@/components/common/IconButton.vue";
import ConfirmationOverlay from "@/components/common/ConfirmationOverlay.vue";
import Fullscreen from "@/components/common/Fullscreen.vue";
import CameraComponent from "@/components/common/Camera.vue";
import store, { Status } from "@/store";

@Component({
  components: {
    Button,
    IconButton,
    Fullscreen,
    CameraComponent,
    ConfirmationOverlay,
  },
})
export default class Camera extends Vue {
  private isCameraShown = false;

  private img? = '';

  get startTestButtonLabel() {
    return [Status.PENDING, Status.USER_INTERACTION_REQUIRED].includes(store.state.deviceTest.camera.status)
      ? 'Testa kamera'
      : 'Testa kamera igen'
  }

  get startTestButtonType() {
    return [Status.PENDING, Status.USER_INTERACTION_REQUIRED].includes(store.state.deviceTest.camera.status)
      ? 'primary'
      : 'secondary'
  }

  onStartTest() {
    this.isCameraShown = true
    this.img = ''
    // this.start()
  }

  onEndTest() {
    this.isCameraShown = false
  }

  onCaptured(event: string) {
    this.img = event
  }

  onRejectPhoto() {
    this.img = ''
    // this.start()
  }

  onAcceptPhoto() {
    store.setDeviceTestStatus('camera', Status.SUCCESS)
    this.onEndTest()
  }
}
</script>

<style scoped>
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
