/* eslint-disable no-console */

import { register } from 'register-service-worker'
import * as Analytics from '@/utils/Analytics'

if (process.env.NODE_ENV === 'production') {
  register(`${process.env.BASE_URL}service-worker.js`, {
    ready() {
      console.log(
        'App is being served from cache by a service worker.\n' +
        'For more details, visit https://goo.gl/AFskqB'
      )
    },
    registered(registration: ServiceWorkerRegistration) {
      console.log('Service worker has been registered.')
      setInterval(() => {
        document.dispatchEvent(new CustomEvent('serviceWorkerRegistered', { detail: registration }))
      }, 1000)
    },
    cached() {
      console.log('Content has been cached for offline use.')
    },
    updatefound() {
      console.log('New content is downloading.')
    },
    updated(registration: ServiceWorkerRegistration) {
      Analytics.logEvent(Analytics.AnalyticsEventType.APP, 'found', 'update')
      console.log('New content is available; please refresh.')
      document.dispatchEvent(new CustomEvent('serviceWorkerUpdate', { detail: registration }))
    },
    offline() {
      console.log('No internet connection found. App is running in offline mode.')
    },
    error(error) {
      console.error('Error during service worker registration:', error)
    }
  })
}
