<template>
  <div class="question">
    <p class="text">
      {{ text }}
    </p>
    <slot name="default" />
    <p
      class="text-hint"
      v-if="!!hint"
    >
      {{ hint }}
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
@Component({
  components: {
  }
})
export default class Wrapper extends Vue {
  @Prop() private text!: string;
  @Prop() private hint!: string;
}
</script>

<style scoped>
p.text {
}
p.text-hint {
  font-size: 90%;
  font-style: italic;
}
</style>
