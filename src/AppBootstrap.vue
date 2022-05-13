<template>
  <div id="bootstrapping">
    <Loader message="Vi måste bara kolla en grej..." />
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import Loader from '@/components/common/Loader.vue'
import * as Analytics from '@/utils/Analytics'
import * as ConfigurationUtils from '@/utils/Configuration'
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
      Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'failed', 'app_configuration', {
        message: `It took more than ${LOAD_CONFIG_TIMEOUT} ms to load the config`,
      })
    }, LOAD_CONFIG_TIMEOUT);

    try {
      const conf = await ConfigurationUtils.fetchConfiguration()
      store.setConfiguration(conf)
      this.$emit('success')
    } catch (e: any) {
      this.$emit('failure')
    }

    this.stopTimer()
  }

  stopTimer() {
    if (this.bootstrapTimemoutTimer) {
      clearTimeout(this.bootstrapTimemoutTimer)
      this.bootstrapTimemoutTimer = 0
    }
  }

  async mounted() {
    await this.fetchConfiguration()
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
