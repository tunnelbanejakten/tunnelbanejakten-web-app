<template>
  <div :class="wrapperClasses">
    <div v-if="isQuestionLoading">
      <Loader message="Läser in uppgift" />
    </div>
    <div v-if="!!message">
      <Message
        :header="message"
        :type="messageType"
      />
    </div>
    <div v-if="!isQuestionLoading && !!loadedQuestion">
      <Question
        @change="onAnswerChange"
        :question="loadedQuestion"
        :question-id="questionId"
        :read-only="readOnly"
        :is-submitting="isSubmitting"
        @user-accepts-time-limit="postViewEvent"
        @user-submits-answer="submitAnswer"
      />
      <div
        v-if="isAutoSaveEnabled"
        class="auto-save-status"
      >
        <p v-if="isDirty && !isSubmitting">
          Sparar snart...
        </p>
        <p v-if="isSubmitting">
          Sparar nu...
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Emit, Prop } from 'vue-property-decorator'
import Question from '@/components/common/question/Question.vue'
import Message, { Type as MessageType } from '@/components/common/Message.vue'
import Loader from '@/components/common/Loader.vue'
import { FormUpdate, FormUpdateField, QuestionDto } from './common/question/model'
import * as Analytics from '@/utils/Analytics'
import * as Api from '@/utils/Api'
import { QueuedRequestEvent, QueuedRequestFailedEvent, QueuedRequestSucceededEvent } from '@/utils/Api'
import store from '@/store'

const apiHost = process.env.VUE_APP_API_HOST

@Component({
  components: {
    Question,
    Message,
    Loader
  }
})
export default class QuestionForm extends Vue {
  @Prop() private question!: QuestionDto | null;
  @Prop() private questionId!: string;
  @Prop() private readOnly!: boolean;
  @Prop() private fullScreen!: boolean;

  private loadedQuestion!: QuestionDto;
  private isQuestionLoading = false
  private latestFormUpdate!: FormUpdate;

  private isSubmitting = false

  private message = ''
  private messageType = MessageType.FAILURE
  private isDirty = false
  private submitRequestKey: string = ''

  async created() {
    if (this.question) {
      this.loadedQuestion = this.question
    } else {
      await this.fetchQuestion()
    }
    if (this.isAutoSaveEnabled) {
      Api.addQueueListeners({
        onStart: this.onQueuedSubmitStart,
        onSuccess: this.onQueuedSubmitSuccess,
        onFailure: this.onQueuedSubmitFailure,
      })
    }
  }

  beforeDestroy() {
    if (this.isAutoSaveEnabled) {
      Api.removeQueueListeners({
        onStart: this.onQueuedSubmitStart,
        onSuccess: this.onQueuedSubmitSuccess,
        onFailure: this.onQueuedSubmitFailure,
      })
    }
  }

  onAnswerChange(e: FormUpdate) {
    this.latestFormUpdate = e
    this.isDirty = true
    if (this.isAutoSaveEnabled) {
      this.queueSubmitAnswer()
    }
  }

  onQueuedSubmitStart(event: QueuedRequestEvent) {
    if (event.key !== this.submitRequestKey) return // The event concerns another question
    this.isSubmitting = true
  }

  onQueuedSubmitSuccess(event: QueuedRequestSucceededEvent) {
    if (event.key !== this.submitRequestKey) return // The event concerns another question
    this.isSubmitting = false

    const responsePayload = event.response.payload
    this.isDirty = false
    this.onSubmitSuccess({ ...responsePayload, id: this.questionId })
  }

  onQueuedSubmitFailure(event: QueuedRequestFailedEvent) {
    if (event.key !== this.submitRequestKey) return // The event concerns another question
    this.isSubmitting = false

    if (event.error instanceof Api.ApiError) {
      this.onSubmitFailure(new Error('Kunde inte spara svar'))
    } else {
      this.onSubmitFailure(event.error)
    }
  }

  get isAutoSaveEnabled(): boolean {
    return store.state.autoSave
  }

  get wrapperClasses(): string {
    return `question-form-${this.fullScreen ? 'fullscreen' : 'compact'} question-form-${this.isQuestionLoading ? 'loading' : 'loaded'}`
  }

  async fetchQuestion() {
    try {
      this.isQuestionLoading = true

      const resp = await Api.call({
        endpoint: `${apiHost}/wp-json/tuja/v1/questions/${this.questionId}`
      })
      const payload = resp.payload
      this.loadedQuestion = payload

      Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'fetched', 'question', {
        message: `Fetched question ${this.questionId}.`
      })
    } catch (e: any) {
      if (e instanceof Api.ApiError) {
        Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'failed', 'fetch', {
          message: `Could not fetch question ${this.questionId}.`,
          status: `Http response ${e.status}.`
        })

        this.message = 'Oj då, appen kan inte läsa in kontrollen.'
        this.messageType = MessageType.FAILURE
      } else {
        Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'failed', 'fetch', {
          message: `Could not fetch question ${this.questionId}. Reason: ${e.message}.`
        })

        this.message = 'Något gick fel. ' + e.message
        this.messageType = MessageType.FAILURE
      }
    }
    this.isQuestionLoading = false
  }

  async postViewEvent() {
    this.isSubmitting = true
    try {
      await Api.call({
        endpoint: `${apiHost}/wp-json/tuja/v1/questions/${this.questionId}/view-events`,
        method: 'POST'
      })
      this.onPostViewEventSuccess()
    } catch (e) {
      if (e instanceof Api.ApiError) {
        this.onPostViewEventFailure(new Error('Kunde inte visa fråga'))
      } else {
        this.onPostViewEventFailure(e)
      }
    }
    this.isSubmitting = false
  }

  getApiRequest(): Api.ApiRequest {
    const payload = new FormData()
    if (this.latestFormUpdate) {
      this.latestFormUpdate.updatedFields.forEach(({ key, value }: FormUpdateField) => {
        payload.append(key, value)
      })
    }
    return {
      endpoint: `${apiHost}/wp-json/tuja/v1/questions/${this.questionId}/answer`,
      method: 'POST',
      payload
    } as Api.ApiRequest
  }

  async queueSubmitAnswer() {
    const request = this.getApiRequest()
    this.message = ''
    this.messageType = MessageType.INFO
    this.submitRequestKey = Api.queue(request)
  }

  async submitAnswer() {
    this.isSubmitting = true
    this.message = ''
    this.messageType = MessageType.INFO
    try {
      const resp = await Api.call(this.getApiRequest())
      const responsePayload = resp.payload
      this.isDirty = false
      this.onSubmitSuccess({ ...responsePayload, id: this.questionId })
    } catch (e) {
      if (e instanceof Api.ApiError) {
        this.onSubmitFailure(new Error('Kunde inte spara svar'))
      } else {
        this.onSubmitFailure(e)
      }
    }
    this.isSubmitting = false
  }

  @Emit('submit-success')
  onSubmitSuccess(updatedQuestionData: QuestionDto) {
    this.loadedQuestion = updatedQuestionData
    Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'submitted', 'answer', {
      message: `Submitted answer to question ${this.questionId}.`
    })

    if (!this.isAutoSaveEnabled) {
      this.message = 'Ditt svar sparades'
      this.messageType = MessageType.SUCCESS
    }

    return updatedQuestionData
  }

  @Emit('submit-failure')
  onSubmitFailure(error: any) {
    Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'failed', 'submit', {
      message: `Could not submit answer to question ${this.questionId}. Reason: ${error.message}.`
    })

    this.message = 'Något gick fel. ' + error.message
    this.messageType = MessageType.FAILURE

    return error
  }

  async onPostViewEventSuccess() {
    Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'posted', 'view event', {
      message: `Posted view event for question ${this.questionId}.`
    })

    this.message = ''
    this.messageType = MessageType.INFO

    await this.fetchQuestion()

    return true
  }

  onPostViewEventFailure(error: any) {
    Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'failed', 'post view event', {
      message: `Could not post view event for question ${this.questionId}. Reason: ${error.message}.`
    })

    this.message = 'Något gick fel. ' + error.message
    this.messageType = MessageType.FAILURE

    return error
  }
}
</script>

<style scoped>
.question-form-fullscreen.question-form-loading {
  display: flex;
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: center;
}

.question-form-fullscreen.question-form-loaded {
  margin: 10px;
}

.auto-save-status p {
  font-size: 90%;
  font-style: italic;
  margin: 10px 0 0 0;
}
</style>
