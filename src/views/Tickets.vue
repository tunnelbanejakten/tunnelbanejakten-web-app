<template>
  <Page title="Info">
    <div>
      <Card :verticalMargin="false">
        <div class="input-wrapper">
          <input
            placeholder="Skriv lösenord här..."
            type="text"
            v-model="password"
          >
        </div>
        <Button
          @click="onSubmitPassword"
          :pending="isSubmitting"
          :wide="true"
          label="Byt lösenord mot biljetter"
          type="primary"
        />
        <Message
          v-if="redeemErrorTitle"
          :header="redeemErrorTitle"
          :message="redeemErrorMessage"
          type="failure"
        />
      </Card>
      <Card :verticalMargin="true">
        <div v-if="isLoading">
          <Loader />
        </div>
        <div v-if="!isLoading && !listError">
          <Ticket
            v-for="ticket in tickets"
            :key="ticket.key"
            :ticket="ticket"
          />
          <div v-if="tickets.length === 0">
            <p>Ni har ännu inga biljetter.</p>
            <p>När ni löser startchiffret och när ni varit på bemannade kontroller får ni lösenord som kan bytas mot biljetter.</p>
          </div>
        </div>
        <Message
          v-if="listError"
          header="Oj då"
          :message="listError"
        />
      </Card>
    </div>
  </Page>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Page from '@/components/layout/Page.vue'
import Card from '@/components/layout/Card.vue'
import Profile from './about/Profile.vue'
import store from '@/store'
import * as AuthUtils from '@/utils/Auth'
import Loader from '@/components/common/Loader.vue'
import Message from '@/components/common/Message.vue'
import Button from '@/components/common/Button.vue'
import Ticket, { TicketData } from '@/components/common/Ticket.vue'

const apiHost = process.env.VUE_APP_API_HOST

@Component({
  components: {
    Page,
    Card,
    Profile,
    Loader,
    Message,
    Button,
    Ticket
  }
})
export default class Tickets extends Vue {
  get bodyText() {
    return store.state.configuration.messages.infoPageContent
  }

  private isLoading: boolean = false
  private isSubmitting: boolean = false
  private listError: string = ''
  private redeemErrorTitle: string = ''
  private redeemErrorMessage: string = ''
  private password: string = ''
  private tickets: TicketData[] = []

  async mounted() {
    const token = AuthUtils.getTokenCookie()
    if (token) {
      this.isLoading = true

      const ticketsResp = await fetch(
        `${apiHost}/wp-json/tuja/v1/tickets?token=${token}`
      )
      this.isLoading = false
      if (ticketsResp.ok) {
        const ticketsPayload = await ticketsResp.json()
        this.tickets = ticketsPayload.map((ticket: any) => ({
            key: ticket.station.random_id,
            colour: ticket.colour,
            word: ticket.word,
            stationName: ticket.station.name
          }) as TicketData)
      }
    }
  }

  async onSubmitPassword() {

    const token = AuthUtils.getTokenCookie()
    if (token) {
      this.isSubmitting = true
      this.redeemErrorTitle = ''
      this.redeemErrorMessage = ''

      const resp = await fetch(`${apiHost}/wp-json/tuja/v1/tickets/request?token=${token}`, {
        method: 'POST',
        body: JSON.stringify({ password: this.password }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      this.isSubmitting = false
      if (resp.ok) {
        const respBody = await resp.json()
        this.tickets = respBody.all_tickets
      } else {
        switch (resp.status) {
          case 400:
            this.redeemErrorTitle = 'Du missade något'
            this.redeemErrorMessage = 'Du knappade inte in ett lösenord.'
            break;
          case 404:
            this.redeemErrorTitle = 'Lösenordet är inte giltigt'
            this.redeemErrorMessage = 'Dubbelkolla stavningen.'
            break;
          case 409:
            this.redeemErrorTitle = 'Gammalt lösenord'
            this.redeemErrorMessage = 'Ni har redan använt det här lösenordet en gång. Ni kan inte få fler biljetter från just detta lösenord.'
            break;
          default:
            this.redeemErrorTitle = 'Ett oväntat fel uppstod'
            this.redeemErrorMessage = 'Kontakta kundtjänst om felet återkommer.'
            break;
        }
      }
    }
  }
}
</script>

<style scoped>
.card::v-deep p:first-child {
  margin-top: 0;
}
.card::v-deep p:last-child {
  margin-bottom: 0;
}

input {
  box-sizing: border-box;
  width: 100%;
  margin: 5px 0px 15px 0px;
  padding: 5px;
  border: 1px solid #bbb;

  font: 20px/1.4 "Open Sans", Tahoma, Verdana, Segoe, sans-serif;
}

p.note {
  font-size: 90%;
  font-style: italic;
  margin: 10px 0 0 0;
}
</style>
