<template>
  <div class="overlay-container">
    <p>{{ message }}</p>
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
export default class NotificationOverlay extends Vue {
  @Prop() private message!: string;
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
