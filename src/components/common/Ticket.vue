<template>
  <div
    class="ticket"
    :key="ticket.key"
    :style="{ 'background-color': ticket.colour }"
  >
    <p class="station-name">Biljett till kontroll <strong>{{ ticket.stationName }}</strong>:</p>
    <p class="ticket-word-explanation">När ni kommer till kontrollen ska ni visa den här biljetten på er mobil eller säga detta lösen:</p>
    <p
      class="ticket-word"
      :style="{ 'font-size': (100 / ticket.word.length) + 'vw' }"
    >{{ ticket.word }}</p>
  </div>

</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

export type TicketData = {
  key: string
  colour: string
  stationName: string
  word: string
}

@Component({
  components: {
  }
})
export default class Ticket extends Vue {
  @Prop() private ticket!: Ticket
}
</script>

<style scoped>
.ticket {
  margin: 20px 0 0 0;
  padding: 10px;
  color: rgba(0, 0, 0, 0.6);
  text-align: center;
  border-radius: 5px;
  border: none;
  box-shadow: inset 0px 0px 0px 2px rgb(0 0 0 / 20%);
  box-sizing: border-box;
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