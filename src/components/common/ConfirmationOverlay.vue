<template>
  <div class="overlay-container">
    <p>{{ question }}</p>
    <div class="buttons">
      <Button
        v-if="!!acceptLabel"
        :label="acceptLabel"
        @click="onUserAccept"
      />
      <Button
        v-if="!!rejectLabel"
        :label="rejectLabel"
        @click="onUserReject"
        type="secondary"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Emit, Prop } from 'vue-property-decorator'
import Button from '@/components/common/Button.vue'
@Component({
  components: {
    Button
  }
})
export default class ConfirmationOverlay extends Vue {
  @Prop() private question!: string;
  @Prop() private acceptLabel!: string;
  @Prop() private rejectLabel!: string;

  @Emit('accept')
  onUserAccept() {
    return true
  }

  @Emit('reject')
  onUserReject() {
    return true
  }
}
</script>

<style scoped>
.overlay-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  z-index: 1000; /* To put it above the map */
  text-align: center;
  position: absolute;
  background-color: rgba(255, 255, 255, 0.9);
  bottom: 20px;
  right: 20px;
  left: 20px;
  min-height: 20%;
  color: #000;
}

.overlay-container p {
  margin: 10px;
}

.overlay-container .buttons {
  margin-bottom: 10px;
}

.overlay-container .buttons button {
  margin-left: 10px;
}
.overlay-container .buttons button:first-child {
  margin-left: 0px;
}
</style>
