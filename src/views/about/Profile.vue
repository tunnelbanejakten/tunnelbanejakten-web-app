<template>
  <div>
    <div v-if="isLoading">
      <Loader />
    </div>
    <div v-if="!isLoading && groupName">
      <table>
        <tbody>
          <tr>
            <td>Lagnamn:</td>
            <td>{{ groupName }}</td>
          </tr>
          <tr>
            <td>Tävlingsklass:</td>
            <td>{{ categoryName }}</td>
          </tr>
          <tr>
            <td>Antal tävlande:</td>
            <td>{{ countCompeting }} st</td>
          </tr>
          <tr v-if="countFollower">
            <td>Vuxna som följer med:</td>
            <td>{{ countFollower }} st</td>
          </tr>
        </tbody>
      </table>
      <p>
        Administrera er anmälan i
        <a
          :href="groupPortalLink"
          target="_blank"
          class="group-portal-link"
        >Lagportalen</a>
        <font-awesome-icon
          icon="external-link-alt"
          size="xs"
        />.
      </p>
      <p>Om Kundtjänst frågar så är erat grupp-id <code>{{ groupKey }}</code>.</p>
    </div>
    <div v-if="!isLoading && !groupName">
      <Message
        header="Oj då"
        message="Kunde inte hitta information om erat lag."
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Loader from '@/components/common/Loader.vue'
import Message from '@/components/common/Message.vue'
import * as AuthUtils from '@/utils/Auth'

const apiHost = process.env.VUE_APP_API_HOST

@Component({
  components: {
    Loader,
    Message
  }
})
export default class Profile extends Vue {

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
        this.groupKey = (profilePayload.key ?? '').toUpperCase()
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
a.group-portal-link {
  padding-right: 0.3em;
}
table {
  border-collapse: collapse;
}
table td {
  padding: 0.3em 0;
}
table td:first-child {
  padding-right: 1em;
}
</style>