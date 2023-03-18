<template>
  <Page
    title="Svara"
    :noPadding="true"
  >
    <div
      class="no-questions"
      v-if="isLoadingQuestions"
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
      v-if="!isLoadingQuestions"
      class="container"
    >
      <div class="map-link-wrapper">
        Ni hittar också uppgifter på
        <router-link to="/map">
          <span>kartan</span>
        </router-link>.
      </div>
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
      <component
        v-if="!isQuestionListEmpty"
        :is="currentComponent"
        :question-groups="questionGroups"
      />
    </div>
  </Page>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Loader from '@/components/common/Loader.vue'
import Button from '@/components/common/Button.vue'
import Page from '@/components/layout/Page.vue'
import QuestionForm from '@/components/QuestionForm.vue'
import QuestionListFlat from '@/views/question-list/QuestionListFlat.vue'
import QuestionListByGroup from '@/views/question-list/QuestionListByGroup.vue'
import QuestionListByQuestion from '@/views/question-list/QuestionListByQuestion.vue'
import * as Analytics from '@/utils/Analytics'
import * as Api from '@/utils/Api'
import { FormDto, QuestionGroupDto, ExtendedQuestionGroupDto } from '@/components/common/question/model'
import Message, { Type as MessageType } from '@/components/common/Message.vue'
import store, { QuestionGrouping } from '@/store'

const apiHost = process.env.VUE_APP_API_HOST

@Component({
  components: {
    Page,
    QuestionForm,
    Loader,
    Button,
    Message,
    QuestionListFlat,
    QuestionListByGroup,
    QuestionListByQuestion
  }
})
export default class Answer extends Vue {
  private questionGroups: ExtendedQuestionGroupDto[] = []
  private isLoadingQuestions = false

  private message = ''
  private messageType = MessageType.FAILURE

  private pollingTimeoutId = 0
  private pendingQuestionGroups: ExtendedQuestionGroupDto[] | null = null

  async mounted() {
    this.isLoadingQuestions = true
    this.message = ''

    try {
      this.questionGroups = await this.loadQuestionGroups()
      this.schedulePoll()
    } catch (e: any) {
      this.message = e.message
      this.messageType = MessageType.FAILURE
    }
    this.isLoadingQuestions = false
  }

  async loadQuestionGroups(): Promise<ExtendedQuestionGroupDto[]> {
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
    }
  }

  get questionGrouping() {
    return store.state.configuration.answer.questionGrouping
  }

  get currentComponent() {
    if (this.questionGrouping === QuestionGrouping.BY_QUESTION_GROUP) {
      return 'QuestionListByGroup'
    } else if (this.questionGrouping === QuestionGrouping.BY_QUESTION) {
      return 'QuestionListByQuestion'
    } else {
      return 'QuestionListFlat'
    }
  }

  async pollUpdates() {
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
    } catch (e: any) {
    }

    this.schedulePoll()
  }

  schedulePoll() {
    const pollInterval = (store.state.configuration.updates.configPollInterval || 60)

    console.log(`Will fetch questions in ${pollInterval} seconds.`)
    this.pollingTimeoutId = setTimeout(this.pollUpdates, pollInterval * 1000)
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
      this.questionGroups = []
      setTimeout(() => {
        if (this.pendingQuestionGroups) {
          this.questionGroups = [...this.pendingQuestionGroups]
          this.pendingQuestionGroups = null
        }
      }, 0);
    }
  }

  get isUpdateAvailable(): boolean {
    console.log('isUpdateAvailable', this.pendingQuestionGroups !== null, this.pendingQuestionGroups)
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
.no-questions {
  display: flex;
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: center;
}

div.map-link-wrapper {
  font-size: 90%;
  font-style: italic;
}

.container {
  margin: 10px;
}

.updates-available-container {
  padding: 0 10px;
  text-align: center;
  background-color: #eedfaf;
  border-bottom: 1px solid #c8bb92;
}
.updates-available-container div {
  padding: 10px 0;
}
.updates-available-container small {
  font-size: 80%;
  opacity: 0.4;
}
</style>
