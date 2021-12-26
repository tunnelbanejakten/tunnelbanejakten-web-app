<template>
  <Page title="Info">
    <div
      v-html="bodyText"
      class="body-text"
    />
  </Page>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Page from '@/components/layout/Page.vue'
import store from '@/store'

@Component({
  components: {
    Page
  }
})
export default class About extends Vue {
  get bodyText() {
    return store.state.configuration.messages.infoPageContent
  }
}
</script>

<style scoped>
div.body-text {
  background-color: #fff;
  border-radius: 10px;
  margin: 5px 0;
  padding: 15px;
}
</style>
