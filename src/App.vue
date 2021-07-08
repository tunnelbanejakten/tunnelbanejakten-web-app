<template>
  <div id="app">
    <div
      v-if="isUpdatePending"
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
    <div class="header-image">
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
    <div id="nav">
      <router-link to="/">
        Svara
      </router-link>
      <router-link to="/devicetest">
        Mobiltest
      </router-link>
      <router-link to="/about">
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
import * as Analytics from '@/utils/Analytics'

@Component({
  name: 'App',
  components: {
    Button
  }
})
export default class App extends Mixins(ServiceWorkerMixin) {
  onUpdateApp() {
    this.refreshApplication()
  }

  mounted() {
    Analytics.logEvent(Analytics.AnalyticsEventType.APP, 'load', 'page')
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
</style>
