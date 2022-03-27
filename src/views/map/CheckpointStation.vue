<template>
  <div class="checkpoint-container">
    <div>
      <p>
        Här ({{ locationLabel }}) finns en bemannad kontroll.
      </p>
    </div>
    <Ticket
      v-if="ticket"
      :ticket="ticket"
    />
    <Message
      v-if="pointsReported"
      header="Avklarad"
      message="Poäng har rapporterats in av funktionär."
      type="info"
    />
    <Message
      v-if="!ticket"
      header="Biljett krävs"
      message="Ni har (ännu) ingen biljett för denna kontroll."
      type="failure"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import Ticket, { TicketData } from '@/components/common/Ticket.vue'
import Message from '@/components/common/Message.vue'

@Component({
  components: {
    Ticket,
    Message
  }
})
export default class Checkpoint extends Vue {
  @Prop() private readonly locationLabel!: string
  @Prop() private readonly ticket!: TicketData
  @Prop() private readonly pointsReported!: boolean
}
</script>

<style scoped>
.checkpoint-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  width: 100%;
}

.checkpoint-container > div {
  margin: 0px 10px;
}
</style>
