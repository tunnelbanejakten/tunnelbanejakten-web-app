<template>
  <div>
    <p>Felsökning:</p>
    <div class="option">
      <label><input
          type="checkbox"
          v-model="debugMap"
        >Visa felsökningsinformation på karta</label>
    </div>
    <div class="option">
      <label><input
          type="checkbox"
          v-model="debugConsole"
        >Visa loggfönster</label>
    </div>
    <p v-if="groupKey">Om Kundtjänst frågar så är erat grupp-id <code>{{ groupKey }}</code>.</p>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import store from '@/store'

@Component({
  components: {
  }
})
export default class Settings extends Vue {
  @Prop({ default: '' }) private readonly groupKey!: string

  get debugMap() {
    return store.state.debugSettings.map
  }

  get debugConsole() {
    return store.state.debugSettings.console
  }

  set debugMap(value: boolean) {
    store.setDebugMap(value)
  }

  set debugConsole(value: boolean) {
    store.setDebugConsole(value)
  }
}
</script>

<style scoped>
div.option label {
  display: block;
  width: 100%;
  line-height: 36px;
  padding: 0 5px;
}
</style>