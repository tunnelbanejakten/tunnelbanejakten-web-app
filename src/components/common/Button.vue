<template>
  <button
    type="button"
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

export enum Size {
  NORMAL = 'normal',
  HUGE = 'huge'
}

@Component({
  components: {
  }
})
export default class Button extends Vue {
  @Prop() private label!: string
  @Prop({ default: Type.PRIMARY }) readonly type!: Type
  @Prop({ default: Size.NORMAL }) readonly size!: Size

  @Emit('click')
  onClick() {
    return true
  }

  get buttonClass(): string {
    return `type-${this.type} size-${this.size}`
  }
}
</script>

<style scoped>
button {
  border-radius: 10px;
}

button.size-normal {
  padding: 9px;
}

button.size-huge {
  padding: 14px;
  font-size: 100%;
}

button.type-primary {
  background-color: #e2c7ec;
  border: 1px solid #977ca1;
  color: #000;
}

button.type-secondary {
  background-color: #fff;
  border: 1px solid #977ca1;
  color: #000;
}
</style>
