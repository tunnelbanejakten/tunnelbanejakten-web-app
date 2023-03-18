<template>
  <Page title="Start">
    <Card
      :verticalMargin="false"
      v-html="bodyText"
    />
    <Card
      v-if="groupAppLink"
      :verticalMargin="true"
    >
      <Share
        :authCode="authCode"
        :authLink="groupAppLink"
        :baseLink="baseAppLink"
      />
    </Card>
  </Page>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Page from '@/components/layout/Page.vue'
import Card from '@/components/layout/Card.vue'
import Share from '@/components/Share.vue'
import store from '@/store'

@Component({
  components: {
    Page,
    Card,
    Share
  }
})
export default class Home extends Vue {
  get bodyText() {
    return store.state.configuration.messages.startPageContent
  }
  get authCode() {
    return store.state.profile.authCode
  }
  get groupAppLink() {
    return store.state.profile.groupAppLink
  }
  get baseAppLink() {
    return store.state.profile.baseAppLink
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
