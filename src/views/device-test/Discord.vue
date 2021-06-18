<template>
  <div>
    <p>Under tävlingen, men även inför den, så kommer vi använda Discord för att chatta och prata med varandra.</p>
    <Button label="Jag har ett Discord-konto. Skicka en inbjudning." />
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
export default class Discord extends Vue {}
</script>
