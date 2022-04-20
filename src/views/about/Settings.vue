<template>
  <div>
    <p>Felsökning:</p>
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
    <div class="option">
      <label><input
          type="checkbox"
          v-model="autoSave"
        >Spara automatiskt</label>
    </div>
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
    <p>App-version: <code>{{ appVersion }}</code></p>
    <p v-if="groupKey">Felsöknings-id: <code @click="toggleFullGroupIdShown">{{ groupId }}</code></p>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import * as Analytics from '@/utils/Analytics'
import Button from '@/components/common/Button.vue'
import store from '@/store'
import * as AuthUtils from '@/utils/Auth'

const APP_VERSION = process.env.VUE_APP_VERSION

@Component({
  components: {
    Button
  }
})
export default class Settings extends Vue {
  @Prop({ default: '' }) private readonly groupKey!: string

  private isFullGroupIdShown: boolean = false

  get debugMap() {
    return store.state.debugSettings.map
  }

  get groupId() {
    const groupKey = this.groupKey
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

  get appVersion() : string {
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