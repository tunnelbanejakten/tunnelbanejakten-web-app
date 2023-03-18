<template>
  <div id="bootstrapping">
    <Loader />
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import Loader from '@/components/common/Loader.vue'
import * as Analytics from '@/utils/Analytics'
import * as ConfigurationUtils from '@/utils/Configuration'
import * as ProfileUtils from '@/utils/Profile'
import store from '@/store'

const LOAD_CONFIG_TIMEOUT = 2000

@Component({
  name: 'AppBootstrap',
  components: {
    Loader,
  }
})
export default class AppBootstrap extends Vue {
  private bootstrapTimemoutTimer = 0

  async fetchConfiguration() {
    this.bootstrapTimemoutTimer = setTimeout(() => {
      this.$emit('failure')
      Analytics.logEvent(Analytics.AnalyticsEventType.APP, 'failed', 'app_configuration', {
        message: `It took more than ${LOAD_CONFIG_TIMEOUT} ms to load the config`,
      })
    }, LOAD_CONFIG_TIMEOUT);

    const conf = await ConfigurationUtils.fetchConfiguration()
    store.setConfiguration(conf)

    this.stopTimer()
  }

  stopTimer() {
    if (this.bootstrapTimemoutTimer) {
      clearTimeout(this.bootstrapTimemoutTimer)
      this.bootstrapTimemoutTimer = 0
    }
  }

  async fetchProfile() {
    const profile = await ProfileUtils.fetchProfile()
    Analytics.setUserProperties({
      group_key: profile.groupKey ?? 'unknown',
      group_name: profile.groupName ?? 'unknown'
    })
    store.setProfile(profile)
  }

  async mounted() {
    try {
      await Promise.all([
        this.fetchConfiguration(),
        this.fetchProfile()
      ])
      this.$emit('success')
    } catch (e: any) {
      Analytics.logEvent(Analytics.AnalyticsEventType.APP, 'failed', 'app_bootstrap', {
        message: `Could not bootstrap app. Reason: ${e.message}`,
      })
      this.$emit('failure')
    }
  }

  beforeDestroy() {
    this.stopTimer()
  }
}
</script>

<style>
#bootstrapping {
  display: flex;
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: center;
}
</style>
