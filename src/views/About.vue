<template>
  <Page title="Info &amp; Hjälp">
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
    Card,
  }
})
export default class About extends Vue {
  get bodyText() {
    return store.state.configuration.messages.infoPageContent
  }

}
</script>

<style scoped>
.card::v-deep p:first-child {
  margin-top: 0;
}
.card::v-deep p:last-child {
  margin-bottom: 0;
}
</style>
