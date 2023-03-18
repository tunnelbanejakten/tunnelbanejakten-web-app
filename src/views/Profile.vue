<template>
  <Page title="Mitt lag">
    <div v-if="!groupKey">
      <Message
        type="failure"
        header="Inget lag"
        message="Vi kunde inte hitta information om ditt lag. Du är nog inte inloggad."
      />
    </div>
    <Card v-if="groupKey">
      <Profile
        :groupName="groupName"
        :categoryName="categoryName"
        :countCompeting="countCompeting"
        :countFollower="countFollower"
        :groupPortalLink="groupPortalLink"
      />
    </Card>
    <Card
      v-if="groupKey"
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
import Message from '@/components/common/Message.vue'
import Loader from '@/components/common/Loader.vue'
import Share from '@/components/Share.vue'
import Profile from './profile/Profile.vue'
import store from '@/store'
import * as Analytics from '@/utils/Analytics'
import * as ProfileUtils from '@/utils/Profile'

const apiHost = process.env.VUE_APP_API_HOST

@Component({
  components: {
    Page,
    Card,
    Message,
    Profile,
    Share,
    Loader
  }
})
export default class Settings extends Vue {
  get groupKey() {
    return store.state.profile.groupKey
  }
  get groupName() {
    return store.state.profile.groupName
  }
  get categoryName() {
    return store.state.profile.categoryName
  }
  get countCompeting() {
    return store.state.profile.countCompeting
  }
  get countFollower() {
    return store.state.profile.countFollower
  }
  get groupPortalLink() {
    return store.state.profile.groupPortalLink
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

  async fetchProfile() {
    const profile = await ProfileUtils.fetchProfile()
    Analytics.setUserProperties({
      group_key: profile.groupKey ?? this.groupKey ?? 'unknown',
      group_name: profile.groupName ?? this.groupName ?? 'unknown'
    })
    store.setProfile(profile)
  }

  async mounted() {
    try {
      await this.fetchProfile() // Refresh in background
    } catch (e: any) {
      // Silently ignore error. We don't care
    }
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
