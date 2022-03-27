<template>
  <div
    :class="wrapperClass"
    :key="ticket.key"
  >
    <div
      class="ticket"
      :style="{ 'background-color': ticket.colour }"
    >
      <p class="station-name">Biljett till kontroll <strong>{{ ticket.stationName }}</strong>:</p>
      <p class="ticket-word-explanation">När ni kommer till kontrollen ska ni visa den här biljetten på er mobil eller säga detta lösen:</p>
      <p
        class="ticket-word"
        :style="{ 'font-size': (this.wordFontSize) + 'vw' }"
      >{{ ticket.word }}</p>
    </div>
    <div
      v-if="isUsed"
      class="used-ticket-wrapper"
    >
      <div class="used-ticket-explanation">
        Ni har gjort denna kontroll.
      </div>
    </div>
  </div>

</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

export type TicketData = {
  key: string
  colour: string
  stationName: string
  word: string
  isUsed: boolean
}

@Component({
  components: {
  }
})
export default class Ticket extends Vue {
  @Prop() private ticket!: TicketData

  get wordFontSize(): number {
    return Math.min(25, 100 / this.ticket.word.length)
  }

  get isUsed(): boolean {
    return this.ticket.isUsed
  }

  get wrapperClass(): string {
    return 'ticket-wrapper ' + (this.isUsed ? 'ticket-used' : 'ticket-unused')
  }
}
</script>

<style scoped>
.ticket-wrapper {
  margin: 20px 0 0 0;
}
.ticket-wrapper:first-child {
  margin-top: 0;
}
.ticket {
  padding: 10px;
  color: rgba(0, 0, 0, 0.6);
  text-align: center;
  border-radius: 5px;
  border: none;
  box-shadow: inset 0px 0px 0px 2px rgb(0 0 0 / 20%);
  box-sizing: border-box;
}
.ticket-used {
  position: relative;
}
.ticket-used .used-ticket-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
}
.ticket-used .ticket {
  opacity: 0.5;
}
.used-ticket-explanation {
  background-color: white;
  border-radius: 5px;
  border: 1px solid #bbb;
  padding: 10px 13px;
}
.ticket:first-child {
  margin-top: 0;
}
.ticket-word {
  font-size: 300%;
  font-weight: bolder;
  margin: 0;
  padding: 0.25em 0;
}
.ticket-word-explanation {
  font-size: 80%;
}
.station-name {
  font-size: 125%;
}
</style>