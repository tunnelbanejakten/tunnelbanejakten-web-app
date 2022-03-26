import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faCamera,
  faImage,
  faSyncAlt,
  faTimes,
  faCrosshairs,
  faTrashAlt,
  faBug,
  faCheck,
  faExternalLinkAlt,
  faWifi,
  faMapMarkerAlt,
  faCheckCircle,
  faExclamationTriangle,
  faInfoCircle,
  faGlobe
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faCamera)
library.add(faImage)
library.add(faSyncAlt)
library.add(faTimes)
library.add(faCrosshairs)
library.add(faTrashAlt)
library.add(faBug)
library.add(faCheck)
library.add(faExternalLinkAlt)
library.add(faWifi)
library.add(faMapMarkerAlt)
library.add(faCheckCircle)
library.add(faExclamationTriangle)
library.add(faInfoCircle)
library.add(faGlobe)

Vue.component('font-awesome-icon', FontAwesomeIcon)

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
