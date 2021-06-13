<template>
  <Page title="Home">
    This is the Home page.
    <template v-slot:footer>
      Footer
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
