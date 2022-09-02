<template>
  <Page title="Info">
    <div>
      <Card
        :verticalMargin="false"
        v-html="bodyText"
      />
      <div v-if="isLoading">
        <Loader />
      </div>
      <div v-if="!isLoading && !groupKey">
        <Message
          type="failure"
          header="Inget lag"
          message="Vi kunde inte hitta information om ditt lag. Du är nog inte inloggad."
        />
      </div>
      <Card :verticalMargin="true" v-if="!isLoading && groupKey">
        <Share
          :authCode="authCode"
          :authLink="groupAppLink"
        />
      </Card>
      <Card :verticalMargin="true" v-if="!isLoading && groupKey">
        <Profile
          :groupName="groupName"
          :categoryName="categoryName"
          :countCompeting="countCompeting"
          :countFollower="countFollower"
          :groupPortalLink="groupPortalLink"
        />
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
import Share from './about/Share.vue'
import store from '@/store'
import Loader from '@/components/common/Loader.vue'
import Message from '@/components/common/Message.vue'
import * as Api from '@/utils/Api'

const apiHost = process.env.VUE_APP_API_HOST

@Component({
  components: {
    Page,
    Card,
    Profile,
    Settings,
    Share,
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
  private authCode: string | null = null
  private groupName: string | null = null
  private groupPortalLink: string | null = null
  private groupAppLink: string | null = null
  private categoryName: string | null = null
  private countCompeting: number | null = null
  private countFollower: number | null = null
  private countTeamContact: number | null = null

  async mounted() {
    this.isLoading = true
    this.groupName = null

    try {
      const profileResp = await Api.call({
        endpoint: `${apiHost}/wp-json/tuja/v1/profile`
      })
      const profilePayload = profileResp.payload
      this.groupKey = profilePayload.key ?? ''
      this.authCode = profilePayload.auth_code ?? ''
      this.groupName = profilePayload.name
      this.groupPortalLink = profilePayload.portal_link
      this.groupAppLink = profilePayload.app_link
      this.categoryName = profilePayload.category_name
      this.countCompeting = profilePayload.count_competing
      this.countFollower = profilePayload.count_follower
      this.countTeamContact = profilePayload.count_team_contact
    } catch (e: any) {

    }
    this.isLoading = false
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
