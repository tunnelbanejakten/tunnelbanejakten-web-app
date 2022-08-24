<template>
  <div :class="wrapperClass">
    <div :class="barLowClass"></div>
    <div :class="barMediumClass"></div>
    <div :class="barHighClass"></div>
    <div :class="barHighestClass"></div>
  </div>
</template>

<script lang="ts">
import { AccuracyLevel } from '@/utils/Location';
import { Component, Vue, Prop, Emit } from 'vue-property-decorator'

@Component({
  components: {}
})
export default class AccuracyIcon extends Vue {
  @Prop()
  readonly accuracy!: AccuracyLevel;

  get wrapperClass(): string {
    return `bars accuracy-${AccuracyLevel[this.accuracy]}`
  }


  get barLowClass() {
    const isActive = true//this.accuracy === AccuracyLevel.LOW
    return `bar-LOW active-${isActive}`
  }

  get barMediumClass() {
    const isActive = this.accuracy !== AccuracyLevel.LOW
    return `bar-MEDIUM active-${isActive}`
  }

  get barHighClass() {
    const isActive = this.accuracy === AccuracyLevel.HIGH || this.accuracy === AccuracyLevel.HIGHEST
    return `bar-HIGH active-${isActive}`
  }

  get barHighestClass() {
    const isActive = this.accuracy === AccuracyLevel.HIGHEST
    return `bar-HIGHEST active-${isActive}`
  }

}
</script>

<style scoped>
div.bars {
  width: 20px;
  height: 20px;
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
}
div.bars > div {
  width: 25%;
  height: 100%;
  box-sizing: border-box;
  margin-right: 1px;
}
div.bars > div.bar-LOW {
  height: 25%;
}
div.bars > div.bar-MEDIUM {
  height: 50%;
}
div.bars > div.bar-HIGH {
  height: 75%;
}
div.bars > div.bar-HIGHEST {
  height: 100%;
}

div.bars.accuracy-LOW > div.active-true {
  border: 1px solid rgba(204, 51, 0, 0.9);
  background-color: rgba(204, 51, 0, 0.6);
}

div.bars.accuracy-MEDIUM > div.active-true {
  border: 1px solid rgba(204, 129, 0, 0.9);
  background-color: rgba(204, 129, 0, 0.6);
}

div.bars.accuracy-HIGH > div.active-true {
  border: 1px solid rgba(204, 160, 0, 0.9);
  background-color: rgba(204, 160, 0, 0.6);
}

div.bars.accuracy-HIGHEST > div.active-true {
  border: 1px solid rgba(24, 204, 0, 0.9);
  background-color: rgba(24, 204, 0, 0.6);
}

div.bars > div.active-false {
  border: 1px solid rgba(0, 0, 0, 0.2);
  background-color: rgba(0, 0, 0, 0.1);
}
</style>
