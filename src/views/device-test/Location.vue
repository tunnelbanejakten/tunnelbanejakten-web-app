<template>
  <div>
    Location
    <p>Vissa uppgifter under tävlingen kräver att ni befinner er på vissa platser.</p>
    <p>Därför behöver vi få tillgång till din GPS.</p>
    <Button
      label="Okej, starta"
      @click="onDone"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Button from '@/components/common/Button.vue'
import store, { Status } from '@/store'

@Component({
  components: {
    Button
  }
})
export default class Location extends Vue {
  onDone () {
    store.setDeviceTestStatus('location', Status.SUCCESS)
  }
}
</script>
