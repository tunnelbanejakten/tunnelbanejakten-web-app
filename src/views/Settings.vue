<template>
  <Page title="Inställningar">
    <Card>
      <h2>Förenkla</h2>
      <div class="option">
        <label><input
            type="checkbox"
            v-model="autoSave"
          >Spara automatiskt</label>
      </div>
    </Card>
    <Card :verticalMargin="true">
      <h2>Felsöka</h2>
      <div class="option">
        <label><input
            type="checkbox"
            v-model="debugMap"
          >Visa felsökningsinformation på karta</label>
      </div>
      <div class="option">
        <label><input
            type="checkbox"
            v-model="debugConsole"
          >Visa loggfönster</label>
      </div>
      <p>App-version: <code>{{ appVersion }}</code></p>
      <p v-if="groupId">Felsöknings-id: <code @click="toggleFullGroupIdShown">{{ groupId }}</code></p>
      <div
        class="buttons"
        v-if="isLoggedIn"
      >
        <Button
          @click="onLogOut"
          label="Logga ut"
          type="secondary"
        />
      </div>
    </Card>
  </Page>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import * as Analytics from '@/utils/Analytics'
import Button from '@/components/common/Button.vue'
import store from '@/store'
import * as AuthUtils from '@/utils/Auth'
import Page from '@/components/layout/Page.vue'
import Card from '@/components/layout/Card.vue'
import Message from '@/components/common/Message.vue'

const APP_VERSION = process.env.VUE_APP_VERSION

@Component({
  components: {
    Page,
    Card,
    Message,
    Button
  }
})
export default class Settings extends Vue {
  private isFullGroupIdShown: boolean = false

  get debugMap() {
    return store.state.debugSettings.map
  }

  get groupId() {
    const groupKey = AuthUtils.getGroupKey()
    if (!groupKey) {
      return null
    }
    const deviceId = Analytics.getDeviceId() ?? ''
    return this.isFullGroupIdShown ? `${groupKey}-${deviceId}` : `${groupKey.substring(0, 5).toUpperCase()}-${deviceId.substring(0, 5).toUpperCase()}`
  }

  get debugConsole() {
    return store.state.debugSettings.console
  }

  get autoSave() {
    return store.state.autoSave
  }

  set autoSave(value: boolean) {
    store.setFormAutoSave(value)
  }

  set debugMap(value: boolean) {
    store.setDebugMap(value)
  }

  set debugConsole(value: boolean) {
    store.setDebugConsole(value)
  }

  get isLoggedIn(): boolean {
    return AuthUtils.isLoggedIn()
  }

  get appVersion(): string {
    return APP_VERSION
  }

  toggleFullGroupIdShown() {
    this.isFullGroupIdShown = !this.isFullGroupIdShown
  }

  onLogOut() {
    if (confirm('Vill du logga ut?')) {
      AuthUtils.unsetTokenCookie()
      this.$router.push({ path: '/' })
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
div.option label {
  display: block;
  width: 100%;
  line-height: 36px;
  padding: 0 5px;
}

div.buttons {
  margin: 10px 0 0 0;
}
</style>
