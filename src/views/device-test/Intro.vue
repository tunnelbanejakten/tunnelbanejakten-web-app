<template>
  <div>
    <p>Här kan du testa om din mobil kommer fungera under tävlingen.</p>
    <p>Genom att gå vidare godkänner du att vi sparar data i enlighet med vår <a href="">Integritetspolicy</a>.</p>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Button from '@/components/common/Button.vue'

@Component({
  components: {
    Button
  }
})
export default class Intro extends Vue {
  onStart() {
    console.log('Start')
  }
}
</script>
