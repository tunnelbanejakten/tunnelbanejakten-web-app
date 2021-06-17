<template>
  <div>
    Självtest
    <p>Här kan du testa om din mobil kommer fungera under tävlingen.</p>
    <p>Genom att gå vidare godkänner du att vi...</p>
    <ul>
      <li>sparar en anonym kaka på din mobil,</li>
      <li>sparar data i enlighet med vår <a href="">Integritetspolicy</a>.</li>
    </ul>
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
  onStart () {
    console.log('Start')
  }
}
</script>
