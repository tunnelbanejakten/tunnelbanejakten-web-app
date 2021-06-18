<template>
  <Page title="Svara">
    <p>När tävlingen startar kommer du ser era uppdrag här.</p>
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
export default class Home extends Vue {}
</script>
