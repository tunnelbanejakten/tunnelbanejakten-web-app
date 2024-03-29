<template>
  <Page
    title="Svara"
    :noPadding="true"
  >
    <div
      class="no-questions"
      v-if="isLoadingForFirstTime"
    >
      <Loader />
    </div>
    <div
      v-if="isUpdateAvailable"
      class="updates-available-container"
    >
      <div>
        Listan med uppgifter är inte längre aktuell.
      </div>
      <Button
        @click="onUpdateView"
        label="Uppdatera listan"
      />
      <div><small>Spara dina svar först.</small></div>
    </div>
    <div
      v-if="!isLoadingForFirstTime"
      class="container"
    >
      <div v-if="!!message">
        <Message
          header="Oj då"
          :message="message"
          :type="messageType"
        />
      </div>
      <div v-if="isQuestionListEmpty">
        <Message
          header="Inga uppgifter"
          message="Just nu finns inga uppgifter som ni kan jobba med. Kontakta kundtjänst om detta verkar konstigt."
          type="info"
        />
      </div>

      <div v-if="!isQuestionListEmpty">
        <slot name="default" />
      </div>
    </div>
  </Page>
</template>

<script lang="ts">
import { Component, Vue, Emit } from 'vue-property-decorator'
import Loader from '@/components/common/Loader.vue'
import Button from '@/components/common/Button.vue'
import Page from '@/components/layout/Page.vue'
import Message, { Type as MessageType } from '@/components/common/Message.vue'
import * as Analytics from '@/utils/Analytics'
import * as Api from '@/utils/Api'
import { FormDto, QuestionGroupDto, ExtendedQuestionGroupDto } from '@/components/common/question/model'
import store from '@/store'

const apiHost = process.env.VUE_APP_API_HOST

@Component({
  components: {
    Page,
    Loader,
    Button,
    Message
  }
})
export default class QuestionViewWrapper extends Vue {
  private isLoadingQuestions = false

  private message = ''
  private messageType = MessageType.FAILURE

  private pollingTimeoutId = 0
  private pendingQuestionGroups: ExtendedQuestionGroupDto[] | null = null

  async mounted() {
    const firstPollingDelay = Math.max(0, this.pollingInterval - this.secondsSinceLastPoll)
    this.schedulePoll(firstPollingDelay)
  }

  get isLoadingForFirstTime() {
    return store.state.answers.lastFetchTimestamp === 0
  }

  get questionGroups() {
    return store.state.answers.questionGroups
  }

  get secondsSinceLastPoll() {
    return (Date.now() - store.state.answers.lastFetchTimestamp) / 1000
  }

  async loadQuestionGroups(): Promise<ExtendedQuestionGroupDto[]> {
    this.isLoadingQuestions = true
    try {
      const questionGroups: ExtendedQuestionGroupDto[] = []
      const resp = await Api.call({
        endpoint: `${apiHost}/wp-json/tuja/v1/questions`
      })
      const payload = resp.payload
      payload.forEach((formView: FormDto) => {
        formView.question_groups.forEach((questionGroupView: QuestionGroupDto) => {
          if (questionGroupView.questions && questionGroupView.questions.length) {
            const isQuestionAnswered = questionGroupView.questions.some(q => q.response?.current_value !== null)
            const isGroupVisible = !formView.is_read_only || isQuestionAnswered
            if (isGroupVisible) {
              questionGroups.push({
                ...questionGroupView,
                isReadOnly: formView.is_read_only
              })
            }
          }
        })
      })

      return questionGroups
    } catch (e: any) {
      Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'failed', 'fetch', {
        message: `Could not fetch questions. Reason: ${e.message}.`
      })
      throw e
    } finally {
      this.isLoadingQuestions = false
    }
  }

  async pollUpdates() {
    this.message = ''
    try {
      const pendingQuestionGroups = await this.loadQuestionGroups()
      const currentDigest = this.getDigest(this.questionGroups)
      const pendingDigest = this.getDigest(pendingQuestionGroups)
      if (currentDigest !== pendingDigest) {
        // List of questions has changed.
        this.pendingQuestionGroups = pendingQuestionGroups
        if (this.isQuestionListEmpty) {
          // List was empty before, no point in asking user to refresh page. Just do it.
          this.onUpdateView()
        }
      }
      store.setQuestionGroupsCheckedNow()
    } catch (e: any) {
      this.message = e.message
      this.messageType = MessageType.FAILURE
    }

    this.schedulePoll(this.pollingInterval)
  }

  get pollingInterval() {
    return store.state.configuration.updates.configPollInterval || 60
  }

  schedulePoll(delay: number) {
    this.pollingTimeoutId = setTimeout(this.pollUpdates, delay * 1000)
  }

  stopPolling() {
    if (this.pollingTimeoutId) {
      clearTimeout(this.pollingTimeoutId)
      this.pollingTimeoutId = 0
    }
  }

  beforeDestroy() {
    this.stopPolling()
  }

  onUpdateView() {
    if (this.pendingQuestionGroups) {
      store.setAnswerQuestionGroups([])
      setTimeout(() => {
        if (this.pendingQuestionGroups) {
          store.setAnswerQuestionGroups([...this.pendingQuestionGroups])
          this.pendingQuestionGroups = null
        }
      }, 0);
    }
  }

  get isUpdateAvailable(): boolean {
    return this.pendingQuestionGroups !== null
  }

  get isQuestionListEmpty(): boolean {
    return this.questionGroups.length === 0
  }

  getDigest(input: ExtendedQuestionGroupDto[]) {
    const digestInput = []
    for (const qg of input) {
      const readOnly = qg.isReadOnly
      for (const q of qg.questions) {
        const questionDigest = [
          q.id.toString().padStart(5, '0'),
          readOnly ? 'r' : 'w'
        ].join('-')
        digestInput.push(questionDigest)
      }
    }
    digestInput.sort()
    return digestInput.join()
  }
}
</script>
<style scoped>
.container {
  margin: 10px;
}
.no-questions {
  display: flex;
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: center;
}
</style>