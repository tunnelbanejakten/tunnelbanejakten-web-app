<template>
  <div>
    <p>För att allt ska fungera måste din mobil få kontakt med vår server.</p>
    <Button
      v-if="!isChecking"
      :label="startTestButtonLabel"
      :type="startTestButtonType"
      size="huge"
      :wide="true"
      @click="onStartTest"
    />
    <p v-if="isChecking">
      {{ message }}
    </p>
  </div>
</template>

<script lang="ts">
import store, { Status } from '@/store'
import { Component, Vue, Watch } from 'vue-property-decorator'
import Button from '@/components/common/Button.vue'
import * as Api from '@/utils/Api'

enum BackendStatus {
  UNKNOWN,
  CHECKING,
  CONNECTED,
  CONNECTED_AUTHENTICATED,
  INVALID_RESPONSE,
  FAILED,
}

const apiHost = process.env.VUE_APP_API_HOST

@Component({
  components: {
    Button
  }
})
export default class Connectity extends Vue {
  private backendStatus: BackendStatus = BackendStatus.UNKNOWN;
  private profilePayload: any = null;

  get isChecking() {
    return this.backendStatus === BackendStatus.CHECKING
  }

  get isCheckInitiated() {
    return this.backendStatus !== BackendStatus.UNKNOWN
  }

  get startTestButtonLabel() {
    return [Status.PENDING, Status.USER_INTERACTION_REQUIRED].includes(store.state.deviceTest.connectivity.status)
      ? 'Testa uppkopplingen'
      : 'Testa uppkopplingen igen'
  }

  get startTestButtonType() {
    return [Status.PENDING, Status.USER_INTERACTION_REQUIRED].includes(store.state.deviceTest.connectivity.status)
      ? 'primary'
      : 'secondary'
  }

  get message() {
    switch (this.backendStatus) {
      case BackendStatus.UNKNOWN:
        return 'Vi vet inte om vår server är vaken eller inte.'
      case BackendStatus.CHECKING:
        return 'Vi kollar om du har kontakt med vår server.'
      case BackendStatus.CONNECTED:
        return 'Du har kontakt med vår server.'
      case BackendStatus.CONNECTED_AUTHENTICATED:
        return `Du har kontakt med vår server. Vi ser också att du är inloggad som ${this.profilePayload.name}.`
      case BackendStatus.INVALID_RESPONSE:
        return 'Något är fel med vår server.'
      case BackendStatus.FAILED:
        return 'Det gick inte att få kontakt med vår server.'
    }
  }

  async onStartTest() {
    this.backendStatus = BackendStatus.CHECKING
    try {
      const resp = await fetch(`${apiHost}/wp-json/tuja/v1/ping`)
      const pingPayload = await resp.json()
      if (resp.ok && pingPayload.status === 'ok') {
        try {
          const profileResp = await Api.call({
            endpoint: `${apiHost}/wp-json/tuja/v1/profile`
          })
          this.profilePayload = profileResp.payload
          this.backendStatus = BackendStatus.CONNECTED_AUTHENTICATED
        } catch (e: any) {
          if (e instanceof Api.NotSignedInError) {
            this.backendStatus = BackendStatus.CONNECTED
          } else if (e instanceof Api.ApiError) {
            this.backendStatus = BackendStatus.INVALID_RESPONSE
          } else {
            this.backendStatus = BackendStatus.FAILED
          }
        }
      } else {
        this.backendStatus = BackendStatus.INVALID_RESPONSE
      }
    } catch (e) {
      this.backendStatus = BackendStatus.FAILED
    }
  }

  @Watch('backendStatus')
  onStatusChange(backendStatus: string) {
    const statusMessage = this.message
    switch (this.backendStatus) {
      case BackendStatus.UNKNOWN:
        store.setDeviceTestStatus('connectivity', Status.PENDING, this.message)
        break
      case BackendStatus.CHECKING:
        store.setDeviceTestStatus('connectivity', Status.PENDING, this.message)
        break
      case BackendStatus.CONNECTED:
        store.setDeviceTestStatus('connectivity', Status.SUCCESS, this.message)
        break
      case BackendStatus.CONNECTED_AUTHENTICATED:
        store.setDeviceTestStatus('connectivity', Status.SUCCESS, this.message)
        break
      case BackendStatus.INVALID_RESPONSE:
        store.setDeviceTestStatus('connectivity', Status.FAILURE, this.message)
        break
      case BackendStatus.FAILED:
        store.setDeviceTestStatus('connectivity', Status.FAILURE, this.message)
        break
    }
  }
}
</script>
