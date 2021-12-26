import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faCamera, faSyncAlt, faTimes, faCrosshairs, faTrashAlt, faBug } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faCamera)
library.add(faSyncAlt)
library.add(faTimes)
library.add(faCrosshairs)
library.add(faTrashAlt)
library.add(faBug)

Vue.component('font-awesome-icon', FontAwesomeIcon)

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
