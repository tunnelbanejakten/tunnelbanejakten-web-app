<template>
  <button
    @click="onClick"
    :class="buttonClass"
  >
    {{ label }}
  </button>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit } from 'vue-property-decorator'

export enum Type {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  HUGE = 'huge'
}
@Component({
  components: {
  }
})
export default class Button extends Vue {
  @Prop() private label!: string
  @Prop({ default: Type.PRIMARY }) readonly type!: Type

  @Emit('click')
  onClick () {
    return true
  }

  get buttonClass (): string {
    return `type-${this.type}`
  }
}
</script>

<style scoped>
button {
  border-radius: 10px;
}

button.type-huge {
  background-color: #e2c7ec;
  border: 1px solid #977ca1;
  color: #000;
  padding: 14px;
  font-size: 100%;
}

button.type-primary {
  background-color: #e2c7ec;
  border: 1px solid #977ca1;
  color: #000;
  padding: 9px;
}

button.type-secondary {
  background-color: #fff;
  border: 1px solid #977ca1;
  color: #000;
  padding: 9px;
}
</style>
