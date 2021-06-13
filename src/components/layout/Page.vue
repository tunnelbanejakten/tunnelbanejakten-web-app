<template>
  <div class="page">
    <div class="header">
      <h1>
        {{ title }}
      </h1>
    </div>
    <div class="body">
      <slot name="default" />
    </div>
    <div class="footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class Page extends Vue {
    @Prop() private title!: string
}
</script>

<style scoped>
.page {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}
.header {
    display: flex;
    flex-direction: row;
    justify-content: center;

    background-color: #b3ffdd;
}
.body {
    display: flex;
    flex-direction: column;
    flex: 1;
}
.footer {
    display: flex;
    flex-direction: row;
    justify-content: center;

    background-color: #b3ffdd;
}
</style>
