<template>
  <Page title="Logga in">
    <Card :verticalMargin="false">
      <h2>Inloggning</h2>
      <p v-if="authStatus">{{ authStatus }}</p>
      <div v-if="!isGroupKeySet">
        <p>Be någon som är inloggad att gå till Info-sidan. Koden visas där.</p>
        <div class="input-wrapper">
          <input
            placeholder="Inloggningskod"
            type="text"
            v-model="password"
          >
        </div>
        <Button
          @click="onSubmitPassword"
          :pending="isSubmitting"
          :wide="true"
          label="Logga in"
          type="primary"
        />
      </div>
    </Card>
  </Page>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Page from '@/components/layout/Page.vue'
import Card from '@/components/layout/Card.vue'
import Button from '@/components/common/Button.vue'
import * as AuthUtils from '@/utils/Auth'
import * as Api from '@/utils/Api'
import * as Analytics from '@/utils/Analytics'

const apiHost = process.env.VUE_APP_API_HOST

enum GetTokenStatus {
  NOT_STARTED,
  PENDING,
  SUCCESS,
  FAILURE,
}

@Component({
  components: {
    Page,
    Card,
    Button
  }
})
export default class Auth extends Vue {
  private tokenStatus: GetTokenStatus = GetTokenStatus.NOT_STARTED;
  private password: string = ''
  private isSubmitting: boolean = false

  get authStatus(): string {
    switch (this.tokenStatus) {
      case GetTokenStatus.NOT_STARTED:
        return ''
      case GetTokenStatus.PENDING:
        return 'Loggar in...'
      case GetTokenStatus.SUCCESS:
        return 'Inloggningen gick bra.'
      case GetTokenStatus.FAILURE:
        return 'Något gick fel.'
      default:
        return 'UNKNOWN'
    }
  }

  get isGroupKeySet() {
    return !!this.$route.query.id
  }

  async onSubmitPassword() {
    await this.logIn(this.password)
  }

  get nextRoute(): string {
    return String(this.$route.query.newPath)
  }

  setToken(token: string | null) {
    if (token) {
      AuthUtils.setTokenCookie(token)
    } else {
      AuthUtils.unsetTokenCookie()
    }
  }

  async logIn(id: string) {
    this.isSubmitting = true
    try {
      this.tokenStatus = GetTokenStatus.PENDING
      const resp = await Api.call({
        endpoint: `${apiHost}/wp-json/tuja/v1/tokens`,
        method: 'POST',
        payload: { id },
        unauthenticated: true
      })
      const payload = resp.payload
      this.setToken(payload.token)
      this.tokenStatus = GetTokenStatus.SUCCESS

      const profileResp = await Api.call({
        endpoint: `${apiHost}/wp-json/tuja/v1/profile`
      })
      const profilePayload = profileResp.payload
      Analytics.setUserProperties({
        group_key: profilePayload.key,
        group_name: profilePayload.name
      })

      if (this.nextRoute) {
        await this.$router.push({ path: this.nextRoute })
      }
    } catch (e) {
      if (e instanceof Api.ApiError) {
        this.setToken(null)
      }
      this.tokenStatus = GetTokenStatus.FAILURE
    }
    this.isSubmitting = false
  }

  mounted() {
    if (this.$route.query.id) {
      this.logIn(String(this.$route.query.id))
    }
  }
}
</script>

<style scoped>
input {
  box-sizing: border-box;
  width: 100%;
  margin: 5px 0px 15px 0px;
  padding: 5px;
  border: 1px solid #bbb;

  font: 20px/1.4 "Open Sans", Tahoma, Verdana, Segoe, sans-serif;
}
</style>
