<template>
  <div id="app-login">
    <div v-if="isSubmitting">
      <Loader message="Loggar in..." />
    </div>
    <Card v-if="!isSubmitting">
      <h2>Inloggning</h2>
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
        <Message
          v-if="errorMessage"
          :message="errorMessage"
          type="failure"
        />
      </div>
    </Card>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Button from '@/components/common/Button.vue'
import Loader from '@/components/common/Loader.vue'
import Message from '@/components/common/Message.vue'
import Card from '@/components/layout/Card.vue'
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
  name: 'AppLogin',
  components: {
    Button,
    Loader,
    Card,
    Message,
  }
})
export default class AppLogin extends Vue {
  private password: string = ''
  private tokenStatus: GetTokenStatus = GetTokenStatus.NOT_STARTED;
  private errorMessage: string = ''

  get isSubmitting(): boolean {
    return this.tokenStatus === GetTokenStatus.PENDING
  }

  get isGroupKeySet() {
    return !!this.$route.query.id
  }

  async onSubmitPassword() {
    await this.logIn(this.password)
  }

  setToken(token: string | null) {
    if (token) {
      AuthUtils.setTokenCookie(token)
    } else {
      AuthUtils.unsetTokenCookie()
    }
  }

  async logIn(id: string) {
    this.errorMessage = ''
    this.tokenStatus = GetTokenStatus.PENDING
    try {
      const resp = await Api.call({
        endpoint: `${apiHost}/wp-json/tuja/v1/tokens`,
        method: 'POST',
        payload: { id },
        unauthenticated: true
      })
      const payload = resp.payload
      this.setToken(payload.token)

      const profileResp = await Api.call({
        endpoint: `${apiHost}/wp-json/tuja/v1/profile`
      })
      const profilePayload = profileResp.payload
      Analytics.setUserProperties({
        group_key: profilePayload.key,
        group_name: profilePayload.name
      })

      this.tokenStatus = GetTokenStatus.SUCCESS
      this.$emit('success')
    } catch (e: any) {
      if (e instanceof Api.ApiError) {
        this.setToken(null)
      }
      this.tokenStatus = GetTokenStatus.FAILURE
      this.errorMessage = 'Något gick fel. ' + e.message
      this.$emit('failure')
    }
  }

  async mounted() {
    const authId = String(this.$route.params.authId || '')
    if (authId) {
      await this.logIn(authId)
    }
  }
}
</script>

<style scoped>
#app-login {
  display: flex;
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
input {
  box-sizing: border-box;
  width: 100%;
  margin: 5px 0px 15px 0px;
  padding: 5px;
  border: 1px solid #bbb;

  font: 20px/1.4 "Open Sans", Tahoma, Verdana, Segoe, sans-serif;
}
</style>
