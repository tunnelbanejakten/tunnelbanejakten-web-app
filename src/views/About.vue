<template>
  <Page title="Info">
    <div v-html="bodyText" />
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
