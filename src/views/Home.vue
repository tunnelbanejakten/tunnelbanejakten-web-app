<template>
  <Page title="Start">
    <Card :verticalMargin="false">
      <p>Hej!</p>
      <p>Kul att ni ska tävla i Tunnelbanejakten.</p>
      <p>Den här webappen kommer vara viktig under hela dagen.</p>
      <p>Här kommer ni att...</p>
      <ul>
        <li>Se vart det finns kontroller,</li>
        <li>Skicka in svar på uppgifter,</li>
        <li>Få biljetter till bemannade kontroller,</li>
        <li>Se vilka ni ska duellera.</li>
      </ul>
      <p>Välkomna! Vi ses den 29 april.</p>
    </Card>
  </Page>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Page from '@/components/layout/Page.vue'
import Card from '@/components/layout/Card.vue'

@Component({
  components: {
    Page,
    Card
  }
})
export default class Home extends Vue {

}
</script>

<style scoped>
p:first-child {
  margin-top: 0;
}
p:last-child {
  margin-bottom: 0;
}
</style>
