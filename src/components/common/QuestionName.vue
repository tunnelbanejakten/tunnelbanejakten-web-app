<template>
  <div
    v-if="name"
    class="name"
  >
    Uppgift {{ name }}
    <span
      v-if="scoreMaxMessage"
      class="score-max"
    >{{ scoreMaxMessage }}</span>:
  </div>

</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({
  components: {
  }
})
export default class QuestionName extends Vue {
  @Prop({ default: 'Uppgift' }) private readonly name!: string
  @Prop({ default: 0 }) private readonly scoreMax!: string

  get scoreMaxMessage(): string {
    const scoreMax = this.scoreMax
    return scoreMax ? `(${scoreMax} p)` : ''
  }
}
</script>

<style scoped>
div.name {
  font-weight: bold;
  margin: 0 0 10px 0;
}

span.score-max {
  font-weight: normal;
}
</style>