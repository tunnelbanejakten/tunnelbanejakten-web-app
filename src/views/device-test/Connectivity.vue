<template>
  <div>
    <p>Ett par automatiska test:</p>
    <p>Uppkoppling till Tunnelbanejaktens server</p>
    <p>Spara kaka med anonymt</p>
  </div>
</template>

<script lang="ts">
import store, { Status } from '@/store'
import { Component, Vue, Emit } from 'vue-property-decorator'

@Component({
  components: {
  }
})
export default class Connectity extends Vue {
  mounted () {
    store.setDeviceTestStatus('connectivity', Status.SUCCESS)
  }
}
</script>
