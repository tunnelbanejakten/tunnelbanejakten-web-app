<template>
  <div id="app">
    <DebugPopup v-if="isDebugPopupEnabled" />

    <AppUpdatePending v-if="isUpdatePending" />

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

    <AppMain v-if="isMainMode" />
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
