<template>
  <Page title="Incheckning">
    <div v-if="isLoading">
      <Loader />
    </div>
    <div v-if="!isLoading && !checkinPayload">
      <Message
        type="failure"
        header="Ingen data"
        message="Vi kan inte se om du kan checka in eller inte. Du är nog inte inloggad."
      />
    </div>
    <div v-if="!isLoading && checkinPayload">
      <Card v-if="!isCheckinCompleted && currentStep === 1">

        <h2>Dags att checka in</h2>

        <p class="note">Steg 1 av 2</p>

        <p>Lagets namn: <strong>{{ groupName }}</strong>.</p>

        <p>Tävlingsklass: <strong>{{ categoryName }}</strong>.</p>

        <p>Stämmer detta?</p>

        <div class="buttons">
          <div></div>
          <Button
            label="Ja, fortsätt"
            type="primary"
            @click="onContinue"
          />
        </div>
        <div class="buttons">
          <Button
            label="Något stämmer inte"
            type="secondary"
            @click="onSomethingWrong"
          />
        </div>
      </Card>
      <Card v-if="!isCheckinCompleted && currentStep === 2">
        <h2>Vilka är med idag?</h2>

        <p class="note">Steg 2 av 2</p>

        <p>Markera vilka som <strong>tävlar</strong> idag:</p>

        <OptionsQuestion
          :questionResponse="competingParticipantsQuestionResponse"
          :questionConfig="competingParticipantsQuestionConfig"
          @change="onCompetingParticipantsChange"
        />

        <p v-if="isAdultSupervisorDefined">Markera vilka som bara <strong>följer med</strong>:</p>
        <OptionsQuestion
          v-if="isAdultSupervisorDefined"
          :questionResponse="adultSupervisorsQuestionResponse"
          :questionConfig="adultSupervisorsQuestionConfig"
          @change="onAdultSupervisorsChange"
        />

        <Message
          v-if="checkinErrorTitle"
          :header="checkinErrorTitle"
          :message="checkinErrorMessage"
          type="failure"
        />

        <div class="buttons">
          <Button
            label="Tillbaka"
            type="secondary"
            @click="onBack"
          />
          <Button
            label="Checka in"
            type="primary"
            :pending="isCheckinPending"
            @click="onCheckin"
          />
        </div>
        <div class="buttons">
          <Button
            label="Något stämmer inte"
            type="secondary"
            @click="onSomethingWrong"
          />
        </div>
      </Card>
      <Card v-if="isCheckinCompleted">
        <h2>{{ checkingSuccessfulTitle }}</h2>
        <div v-html="checkingSuccessfulBodyHtml" />
      </Card>
    </div>
    <Fullscreen
      v-if="showSomethingWrongPopup"
      @close="closeSomethingWrongPopup"
    >
      <div class="popup-content-container">
        <h2>{{ somethingWrongTitle }}</h2>
        <div v-html="somethingWrongBodyHtml" />
      </div>
    </Fullscreen>
  </Page>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import Page from '@/components/layout/Page.vue'
import Card from '@/components/layout/Card.vue'
import Loader from '@/components/common/Loader.vue'
import Message from '@/components/common/Message.vue'
import Button from '@/components/common/Button.vue'
import StepbystepProgress from '@/components/common/StepbystepProgress.vue'
import Fullscreen from '@/components/common/Fullscreen.vue'
import OptionsQuestion from '@/components/common/question/OptionsQuestion.vue'
import * as Api from '@/utils/Api'
import * as Analytics from '@/utils/Analytics'
import { FormUpdate } from '@/components/common/question/model'

const apiHost = process.env.VUE_APP_API_HOST

@Component({
  components: {
    Page,
    Card,
    Loader,
    Button,
    Fullscreen,
    Message,
    StepbystepProgress,
    OptionsQuestion
  }
})
export default class Checkin extends Vue {
  private isLoading: boolean = false
  private isCheckinPending: boolean = false
  private isCheckinCompleted: boolean = false
  private checkinPayload: any = null
  private currentStep = 0
  private showSomethingWrongPopup: boolean = false

  private selectedCompetingParticipants: Number[] = []
  private selectedAdultSupervisors: Number[] = []

  private checkinErrorTitle: string = ''
  private checkinErrorMessage: string = ''

  async mounted() {
    this.isLoading = true

    this.currentStep = parseInt(this.$route.params?.stepNumber || '1')

    try {
      const checkinResp = await Api.call({
        endpoint: `${apiHost}/wp-json/tuja/v1/checkin`
      })
      const checkinPayload = checkinResp.payload
      this.checkinPayload = checkinPayload
      this.isCheckinCompleted = checkinPayload.status === 'checkedin'
    } catch (e: any) {

    }
    this.isLoading = false
  }

  get groupName() {
    return this.checkinPayload?.group_name
  }

  get categoryName() {
    return this.checkinPayload?.category_name
  }

  get somethingWrongTitle() {
    return this.checkinPayload?.messages.something_wrong.title
  }

  get somethingWrongBodyHtml() {
    return this.checkinPayload?.messages.something_wrong.body_text
  }

  get checkingSuccessfulTitle() {
    return this.checkinPayload?.messages.checkin_done.title
  }

  get checkingSuccessfulBodyHtml() {
    return this.checkinPayload?.messages.checkin_done.body_text
  }

  get competingParticipants() {
    return this.checkinPayload.participants.filter(({ is_competing: isCompeting }: any): any => !!isCompeting)
  }

  get adultSupervisors() {
    return this.checkinPayload.participants.filter(({ is_adult_supervisor: isAdultSupervisor }: any): any => !!isAdultSupervisor)
  }

  get competingParticipantsQuestionResponse() {
    return { field_name: 'competingParticipants' }

  }

  get competingParticipantsQuestionConfig() {
    return {
      is_single_select: false,
      possible_answers: this.competingParticipants.map(this.displayName)
    }
  }

  get adultSupervisorsQuestionResponse() {
    return { field_name: 'adultSupervisors' }

  }

  get adultSupervisorsQuestionConfig() {
    return {
      is_single_select: false,
      possible_answers: this.adultSupervisors.map(this.displayName)
    }
  }

  get isAdultSupervisorDefined(): boolean {
    return this.adultSupervisors.length > 0
  }

  displayName({ name, phone }: any) {
    return phone ? `${name}, ${phone}` : name
  }

  openSomethingWrongPopup() {
    this.showSomethingWrongPopup = true
  }

  closeSomethingWrongPopup() {
    this.showSomethingWrongPopup = false
  }

  onSomethingWrong() {
    this.openSomethingWrongPopup()
  }

  @Watch('$route')
  onRouteChange(e: any) {
    this.currentStep = parseInt(e.params?.stepNumber || '1')
  }

  onBack() {
    this.$router.push({ name: 'Checkin', params: { stepNumber: '1' } })
  }

  onContinue() {
    this.$router.push({ name: 'Checkin', params: { stepNumber: '2' } })
  }

  getPersonIdsFromFormUpdate(people: any[], update: FormUpdate) {
    return people
      .filter((person: any) => update.updatedFields.some(update => update.value === this.displayName(person)))
      .map(({ id }: any) => id)
  }

  onCompetingParticipantsChange(update: FormUpdate) {
    this.selectedCompetingParticipants = this.getPersonIdsFromFormUpdate(this.competingParticipants, update)
  }

  onAdultSupervisorsChange(update: FormUpdate) {
    this.selectedAdultSupervisors = this.getPersonIdsFromFormUpdate(this.adultSupervisors, update)
  }

  async onCheckin() {
    this.isCheckinPending = true
    this.checkinErrorTitle = ''
    this.checkinErrorMessage = ''

    try {
      const resp = await Api.call({
        endpoint: `${apiHost}/wp-json/tuja/v1/checkin`,
        method: 'POST',
        payload: { people_ids: [...this.selectedAdultSupervisors, ...this.selectedCompetingParticipants] },
      })
      this.isCheckinCompleted = true
    } catch (e: any) {
      if (e instanceof Api.ApiError) {
        switch (e.status) {
          case 400:
            this.checkinErrorTitle = 'Du missade något'
            this.checkinErrorMessage = 'Kryssade du för alla som är med?'
            break;
          default:
            this.checkinErrorTitle = 'Det gick inte att checka in'
            this.checkinErrorMessage = 'Kontakta kundtjänst om felet återkommer.'
            break;
        }
        Analytics.logEvent(Analytics.AnalyticsEventType.MISC, 'failed', 'checkin', {
          message: 'Group could not check in. Reason: Non-ok http response.',
          status: `Http response ${e.status}.`
        })
      } else {
        this.checkinErrorTitle = 'Det gick inte att checka in'
        this.checkinErrorMessage = 'Kontakta kundtjänst om felet återkommer.'
        Analytics.logEvent(Analytics.AnalyticsEventType.MISC, 'failed', 'checkin', {
          message: `Group could not check in. Reason: ${e.message}.`
        })
      }

    } finally {
      this.isCheckinPending = false
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
div.buttons {
  margin: 20px 0;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
div.buttons:last-child {
  margin-bottom: 0;
}
</style>