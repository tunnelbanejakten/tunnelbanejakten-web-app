<template>
  <div>
    <div v-if="isQuestionLoading">
      <Loader />
    </div>
    <div v-if="!!message">
      <Message
        :header="message"
        :type="messageType"
      />
    </div>
    <div v-if="!isQuestionLoading && !!loadedQuestion">
      <form ref="form">
        <Question
          :question="loadedQuestion"
          :question-id="questionId"
          :read-only="readOnly"
          :is-submitting="isSubmitting"
          @user-accepts-time-limit="postViewEvent"
          @user-submits-answer="submitAnswer"
        />
      </form>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Emit, Prop } from 'vue-property-decorator'
import Question from '@/components/common/question/Question.vue'
import Message, { Type as MessageType } from '@/components/common/Message.vue'
import Loader from '@/components/common/Loader.vue'
import { QuestionDto } from './common/question/model'
import * as AuthUtils from '@/utils/Auth'
import * as Analytics from '@/utils/Analytics'
import * as Api from '@/utils/Api'

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

  private loadedQuestion!: QuestionDto;
  private isQuestionLoading = false

  private isSubmitting = false

  private message = ''
  private messageType = MessageType.FAILURE

  get submitUrl() {
    const token = AuthUtils.getTokenCookie()

    return `${apiHost}/wp-json/tuja/v1/questions/${this.questionId}/answer?token=${token}`
  }

  async created() {
    if (this.question) {
      this.loadedQuestion = this.question
    } else {
      await this.fetchQuestion()
    }
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

  async submitAnswer() {
    this.isSubmitting = true
    try {
      const formEl = this.$refs.form
      if (formEl) {
        const payload = new FormData(formEl as HTMLFormElement)
        const resp = await Api.call({
          endpoint: `${apiHost}/wp-json/tuja/v1/questions/${this.questionId}/answer`,
          method: 'POST',
          payload
        })
        const responsePayload = resp.payload
        this.isDirty = false
        this.onSubmitSuccess({ ...responsePayload, id: this.questionId })
      }
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

    this.message = 'Ditt svar sparades'
    this.messageType = MessageType.SUCCESS

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

<style>
</style>
