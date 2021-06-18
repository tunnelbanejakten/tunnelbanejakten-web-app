<template>
  <Page title="Info">
    <h2>Så här funkar det</h2>
    <p>...</p>
    <h2>Att tänka på</h2>
    <p>...</p>
    <h2>Tider att passa</h2>
    <p>...</p>
    <template v-slot:footer>
      Tunnelbanejakten &copy; 2021
    </template>
  </Page>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Page from '@/components/layout/Page.vue'

@Component({
  components: {
    Page
  }
})
export default class About extends Vue {}
</script>
