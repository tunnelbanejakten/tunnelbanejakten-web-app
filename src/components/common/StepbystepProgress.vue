<template>
  <div class="wrapper">
    <div class="markers">
      <div v-for="value in stepStatuses" :key="value.key" :class="getClass(value.active)" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({
  components: {
  }
})
export default class StepbystepProgress extends Vue {
  @Prop() private currentStep!: number
  @Prop() private stepCount!: number

  get stepStatuses(): any[] {
    return new Array(this.stepCount).fill(false).map((_, index)=> ({key: index, active: index===this.currentStep-1}))
  }

  getClass(active: boolean) {
    return active ? 'active' : 'inactive'
  }
}
</script>

<style scoped>
.markers {
  display: flex;
  justify-content: center;
}
.markers div {
  height: 10px;
  width: 10px;
  border-radius: 10px;
  border: 1px solid #aaa;
  margin-left: 5px;
}
.markers div:first-child {
  margin-left: 0px;
}
.markers div.active {
  background-color: #aaa;
}
.markers div.inactive {
  background-color: #fff;
}
</style>