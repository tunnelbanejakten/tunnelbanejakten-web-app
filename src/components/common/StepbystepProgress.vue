<template>
  <div class="wrapper">
    <div class="markers">
      <div
        v-for="stepStatus in stepStatuses"
        :key="stepStatus.key"
        :class="getClass(stepStatus.active, stepStatus.status)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { Status } from '@/store'

@Component({
  components: {
  }
})
export default class StepbystepProgress extends Vue {
  @Prop() private currentIndex!: number
  @Prop({ default: [] }) private statuses!: Status[]

  get stepStatuses(): any[] {
    return this.statuses
      .map((status, key) => ({
        key,
        status,
        active: this.currentIndex === key
      }))
  }

  getClass(active: boolean, status: Status) {
    return `${active ? 'active' : 'inactive'} ${String(Status[status]).toLowerCase()}`
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
}
.markers div.active {
  border-width: 3px;
  margin: 5px;
}
.markers div.inactive {
  border-width: 1px;
  margin: 7px;
}
.markers div.pending,
.markers div.user_interaction_required {
  background-color: #fff;
}
.markers div.success {
  background-color: hsl(73, 78%, 57%);
}
.markers div.failure {
  background-color: hsl(4, 78%, 57%);
}
</style>
