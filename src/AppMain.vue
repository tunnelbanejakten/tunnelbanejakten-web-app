<template>
  <div id="app-main-wrapper">
    <div
      id="nav-container"
      @click="onMenuChildClick"
    >
      <div id="nav-items">
        <router-link
          :to="routerPathPrefix() + '/checkin'"
          v-if="isCheckinPageEnabled"
        >
          Incheckning
        </router-link>
        <router-link
          :to="routerPathPrefix() + '/answers'"
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
          :to="routerPathPrefix() + '/duels'"
          v-if="isDuelsPageEnabled"
        >
          Dueller
        </router-link>
        <router-link
          :to="routerPathPrefix() + '/devicetest'"
          v-if="isDeviceTestPageEnabled"
        >
          Mobiltest
        </router-link>
      </div>
      <div
        id="nav-more"
        :class="showMoreButtonClass"
        @click="toggleShowMore"
      >
        <font-awesome-icon
          icon="bars"
          :style="{ color: 'white' }"
          size="1x"
        />
      </div>
      <div
        v-if="showMore"
        id="nav-more-container"
      >
        <div
          id="nav-more-cover"
          @click="toggleShowMore"
        />
        <div id="nav-more-items">
          <div>
            <router-link
              tag='div'
              :to="routerPathPrefix() + '/profile'"
            >
              <font-awesome-icon
                icon="users"
                size="1x"
              />
              Mitt lag
            </router-link>
          </div>
          <div>
            <router-link
              tag='div'
              :to="routerPathPrefix() + '/about'"
              v-if="isInfoPageEnabled"
            >
              <font-awesome-icon
                icon="info-circle"
                size="1x"
              />
              Info &amp; Hjälp
            </router-link>
          </div>
          <div>
            <router-link
              tag='div'
              :to="routerPathPrefix() + '/settings'"
            >
              <font-awesome-icon
                icon="cog"
                size="1x"
              />
              Inställningar
            </router-link>
          </div>
          <div>
            <router-link
              tag='div'
              :to="routerPathPrefix() + '/'"
            >
              <font-awesome-icon
                icon="home"
                size="1x"
              />
              Startsidan
            </router-link>
          </div>
        </div>
      </div>
    </div>
    <router-view />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Button from '@/components/common/Button.vue'
import Loader from '@/components/common/Loader.vue'
import * as AuthUtils from '@/utils/Auth'
import * as ConfigurationUtils from '@/utils/Configuration'
import store from '@/store'

@Component({
  name: 'AppMain',
  components: {
    Button,
    Loader,
  }
})
export default class AppMain extends Vue {
  private confPollTimer = 0
  private showMore = false

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
  
  get isCheckinPageEnabled() {
    return store.state.configuration.views.checkin
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

  get isDuelsPageEnabled() {
    return store.state.configuration.views.duels
  }

  get isInfoPageEnabled() {
    return store.state.configuration.views.info
  }

  get showMoreButtonClass() {
    return this.showMore ? 'show' : 'hide'
  }

  toggleShowMore() {
    this.showMore = !this.showMore
  }

  onMenuChildClick(event: any) {
    const routerLinkElement = event.target.closest('div.router-link-active')
    if (routerLinkElement) {
      // Router Link was clicked. Hide menu.
      this.showMore = false
    }
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

    this.$emit('poll-interval-update', pollInterval)

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

#nav-container {
  display: flex;
  /* Theme from tunnelbanejakten.se: */
  margin: 0px;
  padding: 0;
  cursor: pointer;
  background-color: #738489;
}

#nav-items {
  justify-content: space-evenly;
  display: flex;
  flex: 1;
  align-items: center;
  height: 50px;
}

#nav-more {
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
}

#nav-more-cover,
#nav-more-container {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
}

#nav-more-container {
  z-index: 10001; /* <-- higher than any z-index used by map component. */
  top: 50px;

  margin: 0;
  padding: 0;

  background-color: rgba(255, 255, 255, 0.7);
}

#nav-more-items::v-deep svg {
  margin-right: 10px;
}

#nav-more-items {
  z-index: 10002; /* <-- higher than any z-index used by map component. */
  position: absolute;
  top: 0;
  right: 0;

  margin: 0;
  padding: 0;
}

#nav-more-items,
#nav-more.show {
  background-color: #5a676b;
}

#nav-more-items div div,
#nav-items a {
  display: block;

  /* Theme from tunnelbanejakten.se: */
  text-decoration: none;
  color: #fff;
}

#nav-more-items > div {
  height: 50px;
  line-height: 50px;
  padding: 0 15px;
  vertical-align: middle;
}

/*
#nav a.router-link-exact-active {
}
*/
</style>
