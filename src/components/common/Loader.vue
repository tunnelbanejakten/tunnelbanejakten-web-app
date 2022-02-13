<template>
  <div class="loader">
    <div :class="wrapperClasses">
      <div class="lds-ring">
        <div />
        <div />
        <div />
        <div />
      </div>
    </div>
    <div
      class="message"
      v-if="message"
    >
      {{ message }}
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({
  components: {}
})
export default class Loader extends Vue {
  @Prop() private message!: string
  @Prop() private white!: boolean
  @Prop({ default: 'normal' }) private size!: string

  get wrapperClasses() {
    return `size-${this.size} color-${this.white ? "white" : "black"}`
  }
}
</script>

<style scoped>
/* Credits: https://loading.io/css/ */
.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  align-content: center;
}
.message {
  margin-top: 10px;
}
.size-small {
  transform: scale(0.5) translate(-10px, -10px);
  width: 20px;
  height: 20px;
}
.size-normal {
  transform: scale(1) translate(0px, 0px);
  width: 40px;
  height: 40px;
}
.size-large {
  transform: scale(2) translate(20px, 20px);
  width: 80px;
  height: 80px;
}
.lds-ring {
  display: inline-block;
  position: relative;
  width: 40px;
  height: 40px;
}
.lds-ring div {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 32px;
  height: 32px;
  margin: 4px;
  border: 4px solid #000;
  border-radius: 50%;
  animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: #000 transparent transparent transparent;
}
.color-white .lds-ring div {
  border-color: #fff transparent transparent transparent;
}
.lds-ring div:nth-child(1) {
  animation-delay: -0.45s;
}
.lds-ring div:nth-child(2) {
  animation-delay: -0.3s;
}
.lds-ring div:nth-child(3) {
  animation-delay: -0.15s;
}
@keyframes lds-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
