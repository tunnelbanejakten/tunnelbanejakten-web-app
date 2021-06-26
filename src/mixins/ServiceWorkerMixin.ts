import { Component, Vue } from 'vue-property-decorator'

// Credits: https://dev.to/drbragg/handling-service-worker-updates-in-your-vue-pwa-1pip
@Component
export default class ServiceWorkerMixin extends Vue {
  private isUpdatePending = false
  private isUpdating = false
  private pendingRegistration: any = null

  created () {
    // Listen for event when new service worker is available (emitted by ServiceWorkerMixin)
    document.addEventListener('serviceWorkerUpdate', this.onServiceWorkerUpdated, { once: true })

    // Listen for event when browser has swapped old service worker for new one (emitted by browser itself)
    navigator.serviceWorker.addEventListener('controllerchange', this.onControllerChange)
  }

  /**
   * Event handler for when browser has swapped old service worker for new one
   */
  onControllerChange () {
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
  onServiceWorkerUpdated (event: any) {
    this.isUpdatePending = true
    this.pendingRegistration = event.detail
  }

  /**
   * Function to start the process of swapping out old service worker for new one (assumed to be triggered by user).
   */
  refreshApplication () {
    this.isUpdatePending = false
    console.log('refreshApplication', this.pendingRegistration, this.pendingRegistration.waiting)
    if (this.pendingRegistration && this.pendingRegistration.waiting) {
      this.pendingRegistration.waiting.postMessage({
        type: 'SKIP_WAITING'
      })
    }
  }
}
