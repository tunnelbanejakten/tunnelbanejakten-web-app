<template>
  <div
    id="app"
    @click="onGenericLinkClick"
  >
    <DebugPopup v-if="isDebugPopupEnabled" />

    <AppUpdatePending
      v-if="isUpdatePending"
      @update-clicked="onUpdateApp"
    />

    <AppLogin
      v-if="isLoginMode"
      @success="onLoginSuccess"
      @failure="onLoginFailure"
    />

    <AppBootstrap
      v-if="isBootstrapMode"
      @success="onBootstrapSuccess"
      @failure="onBootstrapFailure"
    />

    <AppMain
      v-if="isMainMode"
      @poll-interval-update="onPollIntervalUpdate"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import ServiceWorkerMixin from '@/mixins/ServiceWorkerMixin'
import DebugPopup from '@/components/DebugPopup.vue'
import * as Analytics from '@/utils/Analytics'
import * as AuthUtils from '@/utils/Auth'
import AppUpdatePending from './AppUpdatePending.vue'
import AppLogin from './AppLogin.vue'
import AppBootstrap from './AppBootstrap.vue'
import AppMain from './AppMain.vue'
import store from '@/store'

enum Mode {
  INIT,
  LOGIN,
  BOOTSTRAP,
  MAIN
}

@Component({
  name: 'App',
  components: {
    DebugPopup,
    AppUpdatePending,
    AppLogin,
    AppBootstrap,
    AppMain,
  }
})
export default class App extends Mixins(ServiceWorkerMixin) {
  private mode: Mode = Mode.INIT

  get isLoginMode() {
    return this.mode === Mode.LOGIN
  }

  get isBootstrapMode() {
    return this.mode === Mode.BOOTSTRAP
  }

  get isMainMode() {
    return this.mode === Mode.MAIN
  }

  onGenericLinkClick({ srcElement }: any) {
    const href = srcElement?.href
    if (href) {
      const protocol = href.match(/^(?<proto>[a-z]+):/)?.groups?.proto ?? 'unknown'
      const page = srcElement.closest('div.page')?.title ?? 'unknown'
      const text = srcElement.textContent
      Analytics.logEvent(Analytics.AnalyticsEventType.MISC, 'click', 'link', {
        href,
        protocol,
        page,
        text
      })
    }
  }

  onUpdateApp() {
    this.refreshApplication() // Inherited from ServiceWorkerMixin
  }

  onPollIntervalUpdate(pollInterval: number) {
    this.setCheckUpdateInterval(pollInterval) // Inherited from ServiceWorkerMixin
  }

  onLoginSuccess() {
    this.mode = Mode.BOOTSTRAP
  }

  onLoginFailure() {
    // this.mode = Mode.LOGIN
  }

  onBootstrapSuccess() {
    this.mode = Mode.MAIN
  }

  onBootstrapFailure() {
    this.mode = Mode.MAIN
  }


  async mounted() {
    if (!AuthUtils.isLoggedIn()) {
      this.mode = Mode.LOGIN
    } else {
      this.mode = Mode.BOOTSTRAP
    }
    Analytics.logEvent(Analytics.AnalyticsEventType.APP, 'load', 'page')
  }

  get isDebugPopupEnabled(): boolean {
    return store.state.debugSettings.console
  }
}
</script>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}
</style>
