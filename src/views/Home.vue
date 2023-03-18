<template>
  <Page title="Start">
    <Card
      :verticalMargin="false"
      v-html="bodyText"
    />
  </Page>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Page from '@/components/layout/Page.vue'
import Card from '@/components/layout/Card.vue'
import store from '@/store'

@Component({
  components: {
    Page,
    Card
  }
})
export default class Home extends Vue {
  get bodyText() {
    return store.state.configuration.messages.startPageContent
  }
}
</script>

<style scoped>
p:first-child {
  margin-top: 0;
}
p:last-child {
  margin-bottom: 0;
}
</style>
