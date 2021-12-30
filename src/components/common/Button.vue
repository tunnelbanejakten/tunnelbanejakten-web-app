<template>
  <button
    type="button"
    @click="onClick"
    :class="buttonClass"
  >
    <span class="button-content">
      <span class="label">{{ label }}</span>
      <span class="spinner">
        <Loader size="small" />
      </span>
    </span>
  </button>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit } from 'vue-property-decorator'
import Loader from '@/components/common/Loader.vue'

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
    Loader
  }
})
export default class Button extends Vue {
  @Prop() private label!: string
  @Prop() private pending!: boolean
  @Prop({ default: Type.PRIMARY }) readonly type!: Type
  @Prop({ default: Size.NORMAL }) readonly size!: Size
  @Prop({ default: false }) readonly wide!: boolean

  @Emit('click')
  onClick() {
    return true
  }

  get buttonClass(): string {
    return `type-${this.type} size-${this.size} pending-${this.pending ? 'yes' : 'no'} width-${this.wide ? 'full' : 'auto'}`
  }
}
</script>

<style scoped>
button {
  border-radius: 10px;
  font: 16px/1.4 "Open Sans", Tahoma, Verdana, Segoe, sans-serif;
}

button.size-normal {
  padding: 10px 20px;
  font-size: 16px;
}

button.size-huge {
  padding: 15px 30px;
  font-size: 20px;
}

button.width-full {
  width: 100%;
}

button.width-autp {
  width: auto;
}

button.type-primary {
  background-color: #977ca1;
  border: 2px solid transparent;
  color: #fff;
}

button.type-secondary {
  background-color: #fff;
  border: 2px solid #977ca1;
  color: #977ca1;
}

span.button-content {
  position: relative;
}

button.pending-yes span.label {
  visibility: hidden;
}

button.pending-no span.label {
  visibility: visible;
}

button span.spinner {
  width: 100%;
  left: 0;
  position: absolute;
  top: 50%;
  margin-top: -10px;
}

button.pending-yes span.spinner {
  display: inline-block;
}

button.pending-no span.spinner {
  display: none;
}
</style>
