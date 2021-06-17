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
  SECONDARY = 'secondary'
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
  border-radius: 3px;
}

button.type-primary {
  background-color: #e2c7ec;
  border: 2px solid #977ca1;
  color: #2d2530;
  padding: 9px;

  font-weight: bold;
}

button.type-secondary {
  background-color: #eed2f8;
  border: 1px solid #c6a3d3;
  color: #413646;
  padding: 10px;
}
</style>
