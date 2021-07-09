<template>
  <div class="overlay-container">
    <p>{{ message }}</p>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Emit, Prop } from "vue-property-decorator";
import Button from "@/components/common/Button.vue";
@Component({
  components: {
    Button,
  },
})
export default class NotificationOverlay extends Vue {
  @Prop() private message!: string;
}
</script>

<style scoped>
.overlay-container {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  z-index: 1000; /* To put it above the map */
  text-align: center;
  position: absolute;
  bottom: 10px;
  background-color: rgba(255, 255, 255, 0.7);
  right: 10px;
  left: 10px;
  color: rgba(0, 0, 0, 0.7);
  font-size: 90%;
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
