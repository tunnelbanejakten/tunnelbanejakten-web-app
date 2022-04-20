<template>
  <div class="new-version-container">
    <div>
      Det finns en <strong>ny version</strong> av den här sidan.
    </div>
    <Button
      :pending="isUpdateClicked"
      @click="onUpdateApp"
      label="Uppdatera nu"
    />
    <div><small>Spara dina svar innan du uppdaterar.</small></div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import Loader from '@/components/common/Loader.vue'
import Button from '@/components/common/Button.vue'
import ServiceWorkerMixin from '@/mixins/ServiceWorkerMixin'

@Component({
  name: 'AppUpdatePending',
  components: {
    Loader,
    Button,
  }
})
export default class AppUpdatePending extends Mixins(ServiceWorkerMixin) {
  private isUpdateClicked: boolean = false
  onUpdateApp() {
    this.isUpdateClicked = true
    this.refreshApplication()
  }
}
</script>

<style scoped>
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