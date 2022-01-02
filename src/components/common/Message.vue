<template>
  <div :class="containerClass">
    <div
      class="icon"
      v-if="icon"
    >
      <font-awesome-icon
        :icon="icon"
        :style="{ color: iconColor }"
        size="2x"
      />
    </div>
    <div class="content">
      <div
        v-if="!!header"
        class="header"
      >
        <font-awesome-icon
          v-if="headerIcon"
          :icon="headerIcon"
          size="1x"
        />
        {{ header }}
      </div>
      <div
        v-if="!!message"
        class="message"
      >
        {{ message }}
      </div>
      <div
        v-if="isExtraContentDefined"
        class="extra-content"
      >
        <slot name="default" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

export enum Type {
  INFO = 'info',
  SUCCESS = 'success',
  FAILURE = 'failure',
}

const icons: Record<Type, string> = {
  [Type.INFO]: 'info-circle',
  [Type.SUCCESS]: 'check-circle',
  [Type.FAILURE]: 'exclamation-triangle',
}

const iconColors: Record<Type, string> = {
  [Type.INFO]: '#7c8da1',
  [Type.SUCCESS]: '#85a17c',
  [Type.FAILURE]: '#bd8383',
}

@Component({
  components: {}
})
export default class Message extends Vue {
  @Prop() private readonly message!: string;
  @Prop() private readonly header!: string;
  @Prop() private readonly headerIcon!: string;
  @Prop({ default: Type.INFO }) private readonly type!: Type;

  get containerClass(): string {
    return `message-container type-${this.type}`
  }

  get icon(): string {
    return icons[this.type]
  }

  get iconColor(): string {
    return iconColors[this.type]
  }

  get isExtraContentDefined() {
    return !!this.$slots.default
  }

}
</script>

<style scoped>
.message-container {
  border: 1px solid #000;
  padding: 15px;
  margin: 10px 0;
  display: flex;
  border-radius: 10px;
}

.message-container.type-info {
  background-color: #c7e6ec;
  border: 1px solid #7c8da1;
  color: #000;
}

.message-container.type-success {
  background-color: #d4ecc7;
  border: 1px solid #85a17c;
  color: #000;
}

.message-container.type-failure {
  background-color: #ecc7c7;
  border: 1px solid #bd8383;
  color: #000;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.extra-content {
  margin: 15px 0 0 0;
}

.icon {
  margin: 0 15px 0 0;
  width: 36px;
  text-align: center;
}

.header {
  font-weight: bold;
}

.content div {
  margin: 15px 0 0 0;
}

.content div:first-child {
  margin: 5px 0 0 0;
}
</style>
