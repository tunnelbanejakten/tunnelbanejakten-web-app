<template>
  <div id="app-main-wrapper">
    <div
      id="nav"
    >
      <router-link
        :to="routerPathPrefix() + '/'"
        v-if="isAnswerPageEnabled"
      >
        Svara
      </router-link>
      <router-link
        :to="routerPathPrefix() + '/map'"
        v-if="isMapPageEnabled"
      >
        Karta
      </router-link>
      <router-link
        :to="routerPathPrefix() + '/tickets'"
        v-if="isTicketsPageEnabled"
      >
        Biljetter
      </router-link>
      <router-link
        :to="routerPathPrefix() + '/devicetest'"
        v-if="isDeviceTestPageEnabled"
      >
        Mobiltest
      </router-link>
      <router-link
        :to="routerPathPrefix() + '/about'"
        v-if="isInfoPageEnabled"
      >
        Info
      </router-link>
    </div>
    <router-view />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import ServiceWorkerMixin from '@/mixins/ServiceWorkerMixin'
import Button from '@/components/common/Button.vue'
import Loader from '@/components/common/Loader.vue'
import DebugPopup from '@/components/DebugPopup.vue'
import * as AuthUtils from '@/utils/Auth'
import * as ConfigurationUtils from '@/utils/Configuration'
import store from '@/store'

@Component({
  name: 'AppMain',
  components: {
    Button,
    Loader,
    DebugPopup
  }
})
export default class AppMain extends Mixins(ServiceWorkerMixin) {
  private confPollTimer = 0

  routerPathPrefix() {
    const groupKey = AuthUtils.getGroupKey()
    if (groupKey) {
      return `/${groupKey}`
    }
    return ''
  }

  get isAnswerPageEnabled() {
    return store.state.configuration.views.answer
  }

  get isMapPageEnabled() {
    return store.state.configuration.views.map
  }

  get isDeviceTestPageEnabled() {
    return store.state.configuration.views.deviceTest
  }

  get isTicketsPageEnabled() {
    return store.state.configuration.views.tickets
  }

  get isInfoPageEnabled() {
    return store.state.configuration.views.info
  }

  async fetchConfiguration() {
    try {
      const conf = await ConfigurationUtils.fetchConfiguration()
      store.setConfiguration(conf)
    } catch (e: any) {

    }
  }

  async pollJob() {
    await this.fetchConfiguration()

    const pollInterval = (store.state.configuration.updates.configPollInterval || 60)

    this.setCheckUpdateInterval(pollInterval)

    console.log(`Will fetch configuration in ${pollInterval} seconds.`)
    this.confPollTimer = setTimeout(this.pollJob, pollInterval * 1000)
  }

  async initConfigurationPoll() {
    await this.pollJob()
  }

  async mounted() {
    await this.initConfigurationPoll()
  }

  beforeDestroy() {
    if (this.confPollTimer) {
      clearTimeout(this.confPollTimer)
    }
  }
}
</script>

<style scoped>
#app-main-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

#nav {
  display: flex;
  justify-content: space-evenly;

  /* Theme from tunnelbanejakten.se: */
  padding: 0px;
  cursor: pointer;
  background-color: #738489;
  padding: 15px 0;
}

#nav a {
  display: block;

  /* Theme from tunnelbanejakten.se: */
  text-decoration: none;
  text-transform: uppercase;
  color: #fff;
}
/*
#nav a.router-link-exact-active {
}
*/
</style>
