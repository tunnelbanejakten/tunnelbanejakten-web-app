<template>
  <div class="page" :title="title">
    <div :class="bodyClasses">
      <slot name="default" />
    </div>
    <div
      class="footer"
      v-if="isFooterDefined"
    >
      <div>
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class Page extends Vue {
    @Prop() private title!: string
    @Prop() private noPadding!: boolean

    get isFooterDefined() {
      return !!this.$slots.footer
    }

    get bodyClasses() {
      return this.noPadding ? 'body no-padding' : 'body'
    }
}
</script>

<style scoped>
.page {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}

h1 {
  /* Theme from tunnelbanejakten.se: */
  font-size: 30px;
  padding-top: 30px;
  padding-bottom: 10px;
}

.header {
    display: flex;
    flex-direction: row;
    justify-content: center;

    padding: 10px;
}

.body {
    display: flex;
    flex-direction: column;
    flex: 1;

    padding: 10px;

    background-color: #ddd;
}

.body.no-padding {
    padding: 0;
}

.footer {
    display: flex;
    flex-direction: row;
    justify-content: center;

    /* Theme from tunnelbanejakten.se: */
    padding: 20px 0;
    margin: 0;
    color: #fff;
    font-size: 14px;
    line-height: 1.25;
    text-decoration: none;
    background-color: #738489;
}

.footer div {
  /* Theme from tunnelbanejakten.se: */
  opacity: 0.8;
}

.footer a {
  /* Theme from tunnelbanejakten.se: */
  color: #fff;
}
</style>
