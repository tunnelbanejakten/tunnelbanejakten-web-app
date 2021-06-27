<template>
  <div :class="containerClass">
    <div v-if="!!header" class="header">
      {{ header }}
    </div>
    <div v-if="!!message" class="message">
      {{ message }}
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";

export enum Type {
  INFO = "info",
  SUCCESS = "success",
  FAILURE = "failure",
}
@Component({
  components: {},
})
export default class Message extends Vue {
  @Prop() private readonly message!: string;
  @Prop() private readonly header!: string;
  @Prop({ default: Type.INFO }) private readonly type!: Type;

  get containerClass(): string {
    return `message-container type-${this.type}`;
  }
}
</script>

<style scoped>
.message-container {
  border: 1px solid #000;
  padding: 10px;
  margin: 10px 0;
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

.header {
    font-weight: bold;
    margin: 0 0 10px 0;
}
</style>
