<template>
  <div>
    <p>För att allt ska fungera måste din mobil få kontakt med vår server.</p>
    <Button
      v-if="!isChecking"
      label="Testa uppkopplingen"
      type="huge"
      @click="onStartTest"
    />
    <p v-if="isCheckInitiated">{{ backendStatus }}</p>
  </div>
</template>

<script lang="ts">
import store, { Status } from "@/store";
import { Component, Vue, Watch } from "vue-property-decorator";
import Button from '@/components/common/Button.vue'

const BackendStatus = {
  UNKNOWN: "Vi vet inte om vår server är vaken eller inte.",
  CHECKING: "Vi kollar om du har kontakt med vår server.",
  ONLINE: "Vi har kontakt med vår server.",
  INVALID_RESPONSE: "Något är fel med vår server.",
  FAILED: "Det gick inte att få kontakt med vår server.",
};

const apiHost = process.env.VUE_APP_API_HOST;

@Component({
  components: {
    Button,
  },
})
export default class Connectity extends Vue {
  private backendStatus = BackendStatus.UNKNOWN;
  
  get isChecking() {
    return this.backendStatus === BackendStatus.CHECKING;
  }
  
  get isCheckInitiated() {
    return this.backendStatus !== BackendStatus.UNKNOWN;
  }
  
  async onStartTest() {
    this.backendStatus = BackendStatus.CHECKING;
    try {
      const resp = await fetch(`${apiHost}/wp-json/tuja/v1/ping`);
      const payload = await resp.json();
      this.backendStatus = resp.ok ? BackendStatus.ONLINE : BackendStatus.INVALID_RESPONSE;
    } catch (e) {
      this.backendStatus = BackendStatus.FAILED;
    }
  }

  @Watch("backendStatus")
  onStatusChange(backendStatus: string) {
    store.setDeviceTestStatus(
      "connectivity",
      {
        [BackendStatus.UNKNOWN]: Status.PENDING,
        [BackendStatus.CHECKING]: Status.PENDING,
        [BackendStatus.ONLINE]: Status.SUCCESS,
        [BackendStatus.FAILED]: Status.FAILURE,
        [BackendStatus.INVALID_RESPONSE]: Status.FAILURE,
      }[backendStatus] || Status.PENDING
    );
  }
}
</script>
