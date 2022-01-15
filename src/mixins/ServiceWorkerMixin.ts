import { Component, Vue } from 'vue-property-decorator'
import * as Analytics from '@/utils/Analytics'

const DEFAULT_UPDATE_CHECK_INTERVAL_SECONDS = 5 * 60

// Credits: https://dev.to/drbragg/handling-service-worker-updates-in-your-vue-pwa-1pip
@Component
export default class ServiceWorkerMixin extends Vue {
  private isUpdatePending = false
  private isUpdating = false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pendingRegistration: any = null
  private currentRegistration: any = null
  private checkUpdateTimer: number = 0
  private checkUpdateInterval: number = DEFAULT_UPDATE_CHECK_INTERVAL_SECONDS

  created() {
    // Listen for event when the service worker is registrered/started (emitted by registerServiceWorker)
    document.addEventListener('serviceWorkerRegistered', this.onServiceWorkerRegistrered, { once: true })

    // Listen for event when new service worker is available (emitted by registerServiceWorker)
    document.addEventListener('serviceWorkerUpdate', this.onServiceWorkerUpdated, { once: true })

    // Listen for event when browser has swapped old service worker for new one (emitted by browser itself)
    navigator.serviceWorker.addEventListener('controllerchange', this.onControllerChange)
  }

  beforeDestroy() {
    if (this.checkUpdateTimer !== 0) {
      clearInterval(this.checkUpdateTimer)
    }
  }

  /**
   * Event handler for when browser has swapped old service worker for new one
   */
  onControllerChange() {
    if (this.isUpdating) {
      return
    }
    this.isUpdating = true

    // Refresh/reload page to "activate" the new service worker and get the latest assets
    window.location.reload()
  }

  /**
   * Event handler for when a new version of the service worker has been detected (but not yet activated/used).
   */
  onServiceWorkerUpdated(event: any) {
    Analytics.logEvent(Analytics.AnalyticsEventType.APP, 'prompt', 'update')
    this.isUpdatePending = true
    this.pendingRegistration = event.detail
  }

  onServiceWorkerRegistrered(event: any) {
    if (this.checkUpdateTimer === 0) {
      this.currentRegistration = event.detail
      this.scheduleUpdateCheck()
    }
  }

  checkForUpdate() {
    console.log('🔎 Checking for update', this.currentRegistration)
    Analytics.logEvent(Analytics.AnalyticsEventType.APP, 'check', 'update')
    this.currentRegistration.update()

    this.scheduleUpdateCheck()
  }

  scheduleUpdateCheck() {
    if (this.checkUpdateTimer) {
      clearTimeout(this.checkUpdateTimer)
    }
    console.log(`⏱ Next update check will happen in ${this.checkUpdateInterval} seconds.`, this.currentRegistration)
    this.checkUpdateTimer = setTimeout(this.checkForUpdate, this.checkUpdateInterval * 1000);
  }

  /**
   * Function to start the process of swapping out old service worker for new one (assumed to be triggered by user).
   */
  refreshApplication() {
    Analytics.logEvent(Analytics.AnalyticsEventType.APP, 'install', 'update')
    this.isUpdatePending = false
    if (this.pendingRegistration && this.pendingRegistration.waiting) {
      this.pendingRegistration.waiting.postMessage({
        type: 'SKIP_WAITING'
      })
    }
  }

  setCheckUpdateInterval(interval: number) {
    if (interval !== this.checkUpdateInterval) {
      console.log(`⏱ Changing update-check interval from ${this.checkUpdateInterval} to ${interval}.`)
      this.checkUpdateInterval = interval
      this.scheduleUpdateCheck()
    }
  }
}
