<template>
  <Page title="Info">
    <div>
      <Card :verticalMargin="true" v-html="bodyText" />
      <Card :verticalMargin="true">
        <div v-if="isLoading">
          <Loader />
        </div>
        <Profile
          v-if="!isLoading && groupKey"
          :groupName="groupName"
          :categoryName="categoryName"
          :countCompeting="countCompeting"
          :countFollower="countFollower"
          :groupPortalLink="groupPortalLink"
        />
        <div v-if="!isLoading && !groupKey">
          <Message
            header="Oj då"
            message="Kunde inte hitta information om ditt lag."
          />
        </div>
      </Card>
      <Card :verticalMargin="true">
        <Settings :groupKey="groupKey" />
      </Card>
    </div>
  </Page>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Page from '@/components/layout/Page.vue'
import Card from '@/components/layout/Card.vue'
import Profile from './about/Profile.vue'
import Settings from './about/Settings.vue'
import store from '@/store'
import * as AuthUtils from '@/utils/Auth'
import Loader from '@/components/common/Loader.vue'
import Message from '@/components/common/Message.vue'

const apiHost = process.env.VUE_APP_API_HOST

@Component({
  components: {
    Page,
    Card,
    Profile,
    Settings,
    Loader,
    Message
  }
})
export default class About extends Vue {
  get bodyText() {
    return store.state.configuration.messages.infoPageContent
  }


  private isLoading: boolean = false
  private groupKey: string | null = null
  private groupName: string | null = null
  private groupPortalLink: string | null = null
  private categoryName: string | null = null
  private countCompeting: number | null = null
  private countFollower: number | null = null
  private countTeamContact: number | null = null

  async mounted() {
    const token = AuthUtils.getTokenCookie()
    if (token) {
      this.isLoading = true
      this.groupName = null

      const profileResp = await fetch(
        `${apiHost}/wp-json/tuja/v1/profile?token=${token}`
      )
      this.isLoading = false
      if (profileResp.ok) {
        const profilePayload = await profileResp.json()
        this.groupKey = profilePayload.key ?? ''
        this.groupName = profilePayload.name
        this.groupPortalLink = profilePayload.portal_link
        this.categoryName = profilePayload.category_name
        this.countCompeting = profilePayload.count_competing
        this.countFollower = profilePayload.count_follower
        this.countTeamContact = profilePayload.count_team_contact
      }
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
