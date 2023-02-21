<template>
  <Page title="Info">
    <div>
      <div v-if="isLoading">
        <Loader />
      </div>
      <div v-if="!isLoading && !duelsPayload">
        <Message
          type="failure"
          header="Ingen data"
          message="Vi kunde inte hitta information om era dueller. Du är nog inte inloggad."
        />
      </div>
      <div v-if="!isLoading && duelsPayload">
        <div>
          <Button
            label="Hur fungerar dueller?"
            type="secondary"
            @click="toggleHowToDuel"
          />
        </div>
        <Card
          v-for="duel in duelsPayload"
          :verticalMargin="true"
          :key="duel.name"
        >
          <h2>Duellen "{{ duel.name }}"</h2>
          <div
            v-for="(opponent, index) in duel.opponents"
            :key="opponent.group_name"
            class="opponent"
          >
            <div>
              <div>Motståndare<span v-if="duel.opponents.length > 1"> {{ index + 1}}</span>:<br><strong>{{ opponent.group_name }}</strong></div>
              <div
                v-for="contact in opponent.contacts"
                :key="contact.phone"
              >
                {{ contact.name }}
                <a
                  v-if="!!contact.phone"
                  :href="'tel:' + contact.phone"
                >{{ contact.phone }}</a>
              </div>
            </div>
          </div>
          <p
            class="note"
            v-if="duel.opponents.length > 1"
          >
            <Button
              label="Varför ser jag flera lag här?"
              type="secondary"
              @click="toggleWhyMultipleOpponents"
            />
          </p>
        </Card>
      </div>
    </div>
    <Fullscreen
      v-if="isHowToDuelOpen"
      @close="toggleHowToDuel"
    >
      <div class="popup-content-container">
        <p>Dueller måste utföras tillsammans med <em>ett visst lag</em> på <em>en viss plats</em> och vid <em>en viss tid</em>.</p>
        <div>
          Så här fungerar dueller:
          <ol>
            <li>Var på rätt plats vid rätt tid.</li>
            <li>Leta upp ett av era motståndarlag (ni ser deras nummer nedan om ni vill ringa varandra).</li>
            <li>Starta kontrollen på Karta-fliken.</li>
            <li>Följ instruktionerna och skicka in svar/foto precis som för andra obemannade kontroller. Varje lag måste skicka in ett eget svar/foto.</li>
          </ol>
        </div>
      </div>
    </Fullscreen>
    <Fullscreen
      v-if="isWhyMultipleOpponentsOpen"
      @close="toggleWhyMultipleOpponents"
    >
      <div class="popup-content-container">
        <p>
          I en duell tävlar två lag mot varandra.
        </p>
        <p>
          Om flera lag är på plats samtidigt så får ni komma överens om vem som duellerar mot vem.
        </p>
        <p>
          Ni måste se till så att att alla får duellera mot någon. Det kan alltså bli så att ert lag deltar i samma duell två gånger. Redovisa då den omgången som gick bäst för er.
        </p>
      </div>
    </Fullscreen>
  </Page>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Page from '@/components/layout/Page.vue'
import Card from '@/components/layout/Card.vue'
import Profile from './about/Profile.vue'
import Settings from './about/Settings.vue'
import Share from './about/Share.vue'
import Loader from '@/components/common/Loader.vue'
import Message from '@/components/common/Message.vue'
import Button from '@/components/common/Button.vue'
import Fullscreen from '@/components/common/Fullscreen.vue'
import * as Api from '@/utils/Api'

const apiHost = process.env.VUE_APP_API_HOST

@Component({
  components: {
    Page,
    Card,
    Profile,
    Settings,
    Share,
    Loader,
    Button,
    Fullscreen,
    Message
  }
})
export default class Duels extends Vue {
  private isLoading: boolean = false
  private isWhyMultipleOpponentsOpen: boolean = false
  private isHowToDuelOpen: boolean = false
  private duelsPayload: any = null

  async mounted() {
    this.isLoading = true

    try {
      const duelsResp = await Api.call({
        endpoint: `${apiHost}/wp-json/tuja/v1/duels`
      })
      const duelsPayload = duelsResp.payload
      this.duelsPayload = duelsPayload
    } catch (e: any) {

    }
    this.isLoading = false
  }

  toggleWhyMultipleOpponents() {
    this.isWhyMultipleOpponentsOpen = !this.isWhyMultipleOpponentsOpen
  }

  toggleHowToDuel() {
    this.isHowToDuelOpen = !this.isHowToDuelOpen
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
div.opponent {
  margin-bottom: 20px;
}
p.note {
  font-size: 90%;
  font-style: italic;
  margin: 0;
}
.popup-content-container {
  width: 100%;
  display: flex;
  justify-content: center;
  height: 100%;
  flex-direction: column;
  box-sizing: border-box;
  padding: 20px;
}
</style>