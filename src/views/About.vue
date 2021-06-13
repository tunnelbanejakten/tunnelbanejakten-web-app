<template>
  <Page title="About">
    This is the About page.
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
export default class About extends Vue {}
</script>
