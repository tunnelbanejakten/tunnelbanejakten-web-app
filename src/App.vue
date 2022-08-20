<template>
  <div id="app">
    <DebugPopup v-if="isDebugPopupEnabled" />
    <div
      v-if="!isAppVisible"
      id="bootstrapping"
    >
      <Loader />
    </div>
    <div
      v-if="isAppVisible && isUpdatePending"
      class="new-version-container"
    >
      <div>
        Det finns en <strong>ny version</strong> av den här sidan.
      </div>
      <Button
        @click="onUpdateApp"
        label="Uppdatera nu"
      />
      <div><small>Spara dina svar innan du uppdaterar.</small></div>
    </div>
    <div
      v-if="isAppVisible"
      class="header-image"
    >
      <img
        src="https://new.tunnelbanejakten.se/wp-content/uploads/2020/05/Hemsida-Sidhuvud-1-2020-12-sep-Locked.png"
        width="1080"
        height="190"
        alt="Tunnelbanejakten"
        srcset="
          https://tunnelbanejakten.se/wp-content/uploads/2020/05/Hemsida-Sidhuvud-1-2020-12-sep-Locked.png          1080w,
          https://tunnelbanejakten.se/wp-content/uploads/2020/05/Hemsida-Sidhuvud-1-2020-12-sep-Locked-300x53.png    300w,
          https://tunnelbanejakten.se/wp-content/uploads/2020/05/Hemsida-Sidhuvud-1-2020-12-sep-Locked-1024x180.png 1024w,
          https://tunnelbanejakten.se/wp-content/uploads/2020/05/Hemsida-Sidhuvud-1-2020-12-sep-Locked-768x135.png   768w
        "
        sizes="(max-width: 1080px) 100vw, 1080px"
      >
    </div>
    <div
      v-if="isAppVisible"
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
    <router-view v-if="isAppVisible" />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import ServiceWorkerMixin from '@/mixins/ServiceWorkerMixin'
import Button from '@/components/common/Button.vue'
import Loader from '@/components/common/Loader.vue'
import DebugPopup from '@/components/DebugPopup.vue'
import * as Analytics from '@/utils/Analytics'
import * as AuthUtils from '@/utils/Auth'
import * as Api from '@/utils/Api'
import store, { Configuration, QuestionGrouping } from '@/store'

const apiHost = process.env.VUE_APP_API_HOST

const questionGroupingMapper: Record<string, QuestionGrouping> = {
  by_group: QuestionGrouping.BY_QUESTION_GROUP,
  by_question: QuestionGrouping.BY_QUESTION
}

const LOAD_CONFIG_TIMEOUT = 2000

@Component({
  name: 'App',
  components: {
    Button,
    Loader,
    DebugPopup
  }
})
export default class App extends Mixins(ServiceWorkerMixin) {
  private confPollTimer = 0
  private isAppVisible = false
  private bootstrapTimemoutTimer = 0

  onUpdateApp() {
    this.refreshApplication()
  }

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
      this.bootstrapTimemoutTimer = setTimeout(() => {
        this.isAppVisible = true
        Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'failed', 'app_configuration', {
          message: `It took more than ${LOAD_CONFIG_TIMEOUT} ms to load the config`,
        })
      }, LOAD_CONFIG_TIMEOUT);

      const confResp = await Api.call({
        endpoint: `${apiHost}/wp-json/tuja/v1/configuration`
      })

      const confPayload = await confResp.payload
      const conf: Configuration = {
        positioning: {
          showUnavailableStations: confPayload.app.positioning.show_unavailable_stations,
          highAccuracyThreshold: confPayload.app.positioning.high_accuracy_threshold,
          highAccuracyTimeout: confPayload.app.positioning.high_accuracy_timeout
        },
        uploads: {
          maxFileSize: confPayload.app.uploads.max_file_size
        },
        updates: {
          configPollInterval: confPayload.app.updates.config_poll_interval
        },
        messages: {
          infoPageContent: confPayload.app.messages.info_page_content
        },
        views: {
          answer: confPayload.app.views.answer,
          map: confPayload.app.views.map,
          tickets: confPayload.app.views.tickets,
          deviceTest: confPayload.app.views.device_test,
          info: confPayload.app.views.info
        },
        answer: {
          questionGrouping: questionGroupingMapper[confPayload.app.answer.question_grouping] ?? QuestionGrouping.NONE
        }
      }
      store.setConfiguration(conf)
    } catch (e: any) {
      if (e instanceof Api.ApiError) {
        Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'failed', 'app_configuration', {
          message: 'Could not fetch app configuration. Reason: Non-ok http response.',
          status: `Http response ${e.status}.`
        })
      } else {
        Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'failed', 'app_configuration', {
          message: `Could not fetch app configuration. Reason: ${e.message}.`
        })
      }
    }
    clearTimeout(this.bootstrapTimemoutTimer)
    this.isAppVisible = true
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
    Analytics.logEvent(Analytics.AnalyticsEventType.APP, 'load', 'page')
    await this.initConfigurationPoll()
  }

  beforeDestroy() {
    if (this.confPollTimer) {
      clearTimeout(this.confPollTimer)
    }
  }

  get isDebugPopupEnabled(): boolean {
    return store.state.debugSettings.console
  }
}
</script>

<style>
#app {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.header-image {
  display: none;
}
.header-image img {
  /* Theme from tunnelbanejakten.se: */
  height: auto;
  vertical-align: middle;
  border: 0;
  -ms-box-sizing: border-box;
  box-sizing: border-box;
  -ms-interpolation-mode: bicubic;
  max-width: 100%;
  width: 1080px;
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

.new-version-container {
  padding: 0 10px;
  text-align: center;
  background-color: #eedfaf;
}
.new-version-container div {
  padding: 10px 0;
}
.new-version-container small {
  font-size: 80%;
  opacity: 0.4;
}

#bootstrapping {
  display: flex;
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: center;
}
</style>
