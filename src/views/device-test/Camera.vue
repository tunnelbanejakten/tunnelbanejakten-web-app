<template>
  <div>
    Camera
    <p>Flera uppgifter under tävlingen besvaras med foton.</p>
    <Button
      label="Okej, ta en bild"
      @click="onDone"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Emit } from 'vue-property-decorator'
import Button from '@/components/common/Button.vue'
import store, { Status } from '@/store'

@Component({
  components: {
    Button
  }
})
export default class Camera extends Vue {
  onDone () {
    store.setDeviceTestStatus('camera', Status.SUCCESS)
  }
}
</script>
