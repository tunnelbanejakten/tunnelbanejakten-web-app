<template>
  <button
    @click="onClick"
    :class="buttonClass"
  >
    <font-awesome-icon
      :icon="actualIconName"
      :style="{ color: 'white' }"
      :size="actualIconSize"
    />
  </button>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit } from 'vue-property-decorator'

const Icon: Record<string, string> = {
  CLOSE: 'times',
  CAMERA: 'camera',
  SWITCH: 'sync-alt'
}

const Type: Record<string, string> = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary'
}

const Size: Record<string, string> = {
  NORMAL: '2x',
  HUGE: '3x'
}

@Component({
  components: {}
})
export default class Button extends Vue {
  @Prop({
    validator: (value: string) =>
      Object.keys(Size).includes(value.toUpperCase())
  })
  readonly size!: string;

  @Prop({
    required: true,
    validator: (value: string) =>
      Object.keys(Icon).includes(value.toUpperCase())
  })
  readonly icon!: string;

  @Prop({
    default: Type.PRIMARY,
    validator: (value: string) =>
      Object.keys(Type).includes(value.toUpperCase())
  })
  readonly type!: string;

  @Emit('click')
  onClick() {
    return true
  }

  get actualIconName(): string {
    return Icon[this.icon.toUpperCase()]
  }

  get actualIconSize(): string {
    return Size[this.size?.toUpperCase()] || Size.NORMAL
  }

  get buttonClass(): string {
    return `icon-button size-${this.size} type-${this.type}`
  }
}
</script>

<style scoped>
.icon-button {
  height: 50px;
  width: 50px;
  border-radius: 25px;
  border: 5px solid #fff;
  background-color: rgba(0, 0, 0, 0.5);
  color: black;
}
.icon-button.size-huge {
  height: 80px;
  width: 80px;
  border-radius: 40px;
}
.icon-button.type-secondary {
  border: 5px solid transparent;
  background-color: rgba(0, 0, 0, 0.25);
}
</style>
