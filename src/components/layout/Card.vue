<template>
  <div :class="`card card-vertical-margin-${verticalMargin}`">
    <slot name="default" />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class Card extends Vue {
  @Prop({ default: false }) private readonly verticalMargin!: boolean
}
</script>

<style scoped>
div.card {
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
}
div.card.card-vertical-margin-false {
  margin: 0 0;
}
div.card.card-vertical-margin-true {
  margin: 20px 0;
}
</style>
