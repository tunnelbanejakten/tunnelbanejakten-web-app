<template>
  <div :class="wrapperClasses">
    <div v-if="isQuestionLoading">
      <Loader message="Läser in uppgift" />
    </div>
    <div v-if="!isQuestionLoading && !!loadedQuestion">
      <div
        class="question"
        v-if="!isQuestionAvailable"
      >
        <p>
          Det här är en tidsbegränsad uppgift.
        </p>
        <p>
          Ni har {{ timeLimitHumanReadable }} på er från att uppgiften visas.
        </p>
        <div class="buttons">
          <Button
            label="Visa uppgift"
            :pending="isPostingViewEvent"
            @click="postViewEvent"
          />
        </div>
      </div>
      <div
        class="question"
        v-if="isQuestionAvailable"
      >
        <Question
          @change="onAnswerChange"
          :question-config="loadedQuestion.config"
          :question-response="loadedQuestion.response"
          :question-type="loadedQuestion.type"
          :question-id="questionId"
          :read-only="isAnswerLocked"
        />

        <div v-if="!isTimeLimitExceeded && !readOnly">
          <p
            class="time-status"
            v-if="isTimedQuestion"
          >
            Det är {{ timeLeftHumanReadable }} kvar.
          </p>
        </div>
        <div
          v-if="!isAutoSaveEnabled && !isAnswerLocked"
          class="save-button-wrapper"
        >
          <Button
            @click="submitAnswer"
            :pending="isSubmitting"
            label="Spara"
            :type="saveButtonType"
          />
          <p
            class="time-status"
            v-if="isDirty"
          >
            Kom ihåg att spara!
          </p>
        </div>
      </div>
      <div v-if="isTimeLimitExceeded && !readOnly">
        <p class="time-status">
          Tiden har gått ut. Ni kan inte längre ändra.
        </p>
      </div>
    </div>
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
    <div v-if="!!message">
      <Message
        :header="message"
        :type="messageType"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Emit, Prop, Watch } from 'vue-property-decorator'
import Question from '@/components/common/question/Question.vue'
import Message, { Type as MessageType } from '@/components/common/Message.vue'
import Loader from '@/components/common/Loader.vue'
import Button, { Type as ButtonType } from '@/components/common/Button.vue'
import { FormUpdate, FormUpdateField, QuestionDto } from './common/question/model'
import * as Analytics from '@/utils/Analytics'
import * as Api from '@/utils/Api'
import { QueuedRequestEvent, QueuedRequestFailedEvent, QueuedRequestSucceededEvent } from '@/utils/Api'
import store from '@/store'

const apiHost = process.env.VUE_APP_API_HOST

@Component({
  components: {
    Button,
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

  private loadedQuestion: QuestionDto = {

  } as QuestionDto;
  private isQuestionLoading = false
  private latestFormUpdate!: FormUpdate;

  private isSubmitting = false
  private isPostingViewEvent = false
  private timeLeft = 0
  private countdownTimer = 0

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
    this.stopCountdownTimer()
  }

  stopCountdownTimer() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer)
      this.countdownTimer = 0
    }
  }

  onAnswerChange(e: FormUpdate) {
    this.latestFormUpdate = {
      updatedFields: e.updatedFields.concat([
        {
          key: this.optimisticLockFieldName,
          value: this.optimisticLockCurrentValue
        },
        {
          key: this.trackedAnswersFieldName,
          value: this.trackedAnswersCurrentValue
        }
      ] as FormUpdateField[])
    } as FormUpdate

    this.isDirty = true
    if (this.isAutoSaveEnabled) {
      this.queueSubmitAnswer()
    }
  }

  isQuestionLoaded() {
    return this.loadedQuestion && this.loadedQuestion.type
  }

  get optimisticLockCurrentValue() {
    return this.isQuestionLoaded() ? this.loadedQuestion.optimistic_lock.current_value : -1
  }

  get optimisticLockFieldName() {
    return this.isQuestionLoaded()
      ? this.loadedQuestion.optimistic_lock.field_name
      : 'untitled'
  }

  get trackedAnswersCurrentValue() {
    return this.isQuestionLoaded() ? this.loadedQuestion.tracked_answers.current_value : -1
  }

  get trackedAnswersFieldName() {
    return this.isQuestionLoaded()
      ? this.loadedQuestion.tracked_answers.field_name
      : 'untitled'
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

    this.onSubmitFailure(event.error)
  }

  get isViewEventRequired() {
    return this.loadedQuestion.view_event?.is_required || false
  }

  get isViewEventFound() {
    return this.loadedQuestion.view_event?.is_found || false
  }

  get isQuestionAvailable() {
    return !this.isViewEventRequired || this.isViewEventFound
  }

  get isTimeLimitExceeded() {
    return this.isTimedQuestion && this.isQuestionAvailable && this.timeLeft <= 0
  }

  get isTimeLimitWithMarginExceeded() {
    const durationErrorMargin = this.question?.time_limit?.duration_error_margin || 0
    return this.isTimedQuestion && this.timeLeft + durationErrorMargin <= 0
  }

  get isAnswerLocked() {
    return this.readOnly || this.isTimeLimitWithMarginExceeded
  }

  get isTimedQuestion() {
    return this.isViewEventRequired
  }

  get saveButtonType() {
    return this.isDirty ? ButtonType.PRIMARY : ButtonType.SECONDARY
  }

  updateTimeLeft() {
    const timeEndsMs = Api.serverMsTimeToDeviceTime((this.loadedQuestion.time_limit?.ends_at || 0) * 1000)
    const timeLeftMs = timeEndsMs - Date.now()
    this.timeLeft = Math.round(timeLeftMs / 1000)
  }

  onCountdownTick() {
    this.updateTimeLeft()
    if (this.isTimeLimitWithMarginExceeded) {
      this.stopCountdownTimer()
    }
  }

  @Watch('loadedQuestion')
  onLoadedQuestionUpdated(question: QuestionDto) {
    if (this.isTimedQuestion) {
      this.updateTimeLeft()
      if (this.timeLeft > 0) {
        this.stopCountdownTimer()
        this.countdownTimer = setInterval(this.onCountdownTick, 1000)
      }
    }
  }

  fuzzyTime(seconds: number, roundMinutes: boolean): string {
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    if (min === 0) {
      return `${seconds} sekunder`
    } else {
      if (min < 3 || !roundMinutes) {
        return sec ? `${min} minuter och ${sec} sekunder` : `${min} minuter`
      } else {
        const roundedMin = Math.round(seconds / 60)
        return `ungefär ${roundedMin} minuter`
      }
    }
  }

  get timeLimit(): number {
    return this.loadedQuestion.time_limit?.duration || 0
  }

  get timeLimitHumanReadable(): string {
    return this.fuzzyTime(this.timeLimit, false)
  }

  get timeLeftHumanReadable(): string {
    return this.fuzzyTime(this.timeLeft, true)
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
      this.loadedQuestion = { ...payload }

      Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'fetched', 'question', {
        message: `Fetched question ${this.questionId}.`
      })
      this.$emit('question-fetched', { ...payload, id: this.questionId })
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
    this.isPostingViewEvent = true
    try {
      await Api.call({
        endpoint: `${apiHost}/wp-json/tuja/v1/questions/${this.questionId}/view-events`,
        method: 'POST'
      })
      this.onPostViewEventSuccess()
    } catch (e) {
      if (e instanceof Api.ApiError) {
        this.onPostViewEventFailure(new Error('Kunde inte visa fråga.'))
      } else {
        this.onPostViewEventFailure(e)
      }
    }
    this.isPostingViewEvent = false
  }

  getApiRequest(): Api.ApiRequest {
    const payload = new FormData()
    if (this.latestFormUpdate) {
      this.latestFormUpdate.updatedFields.forEach(({ key, value }: FormUpdateField) => {
        payload.append(key, value)
      })
    } else {
      throw new Error('Inget verkar ha ändrats.')
    }
    return {
      endpoint: `${apiHost}/wp-json/tuja/v1/questions/${this.questionId}/answer`,
      method: 'POST',
      payload
    } as Api.ApiRequest
  }

  async queueSubmitAnswer() {
    try {
      const request = this.getApiRequest()
      this.message = ''
      this.messageType = MessageType.INFO
      this.submitRequestKey = Api.queue(request)
    } catch (e) {
      this.onSubmitFailure(e)
    }
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
      this.onSubmitFailure(e)
    }
    this.isSubmitting = false
  }

  @Emit('submit-success')
  onSubmitSuccess(updatedQuestionData: QuestionDto) {
    this.loadedQuestion = updatedQuestionData
    Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'submitted', 'answer', {
      message: `Submitted answer to question ${this.questionId}.`
    })

    return updatedQuestionData
  }

  @Emit('submit-failure')
  onSubmitFailure(error: any) {
    if (error instanceof Api.ApiError) {
      Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'failed', 'submit', {
        message: `Http error when submitting answer to question ${this.questionId}. Reason: ${error.message}.`,
        status: `Http response ${error.status}.`
      })
    } else {
      Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'failed', 'submit', {
        message: `Could not submit answer to question ${this.questionId}. Reason: ${error.message}.`
      })
    }

    this.message = 'Något gick fel. ' + error.message
    this.messageType = MessageType.FAILURE

    return error
  }

  @Emit('post-view-event-success')
  async onPostViewEventSuccess() {
    Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'posted', 'view event', {
      message: `Posted view event for question ${this.questionId}.`
    })

    this.message = ''
    this.messageType = MessageType.INFO

    await this.fetchQuestion()

    return this.questionId
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

p.time-status {
  font-size: 90%;
  font-style: italic;
  margin: 10px 0 0 0;
}

.save-button-wrapper {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  flex-direction: row;
}

.save-button-wrapper p.time-status {
  margin-top: 0px;
  margin-left: 10px;
}
</style>
