<template>
  <div class="checkpoint-container">
    <div>
      <div v-if="isQuestionLoading">
        Laddar...
      </div>
      <div v-if="!!message">
        <Message
          header="Problem med kontrollen"
          :message="message"
          :type="messageType"
        />
      </div>
      <div v-if="!isQuestionLoading && !!question">
        <form>
          <Question
            :question="question"
            :is-submitting="isSubmitting"
            @user-accepts-time-limit="postViewEvent"
            @user-submits-answer="submitAnswer"
          />
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Emit, Prop } from 'vue-property-decorator'
import Button from '@/components/common/Button.vue'
import Question from '@/components/common/question/Question.vue'
import Message, { Type as MessageType } from '@/components/common/Message.vue'
import * as AuthUtils from '@/utils/Auth'
import * as Analytics from '@/utils/Analytics'
import { QuestionDto } from '@/components/common/question/model'

const apiHost = process.env.VUE_APP_API_HOST

@Component({
  components: {
    Question,
    Button,
    Message
  }
})
export default class Checkpoint extends Vue {
  @Prop() private readonly questionId!: string

  private isQuestionLoading = false
  private question: QuestionDto | null = null

  private message = ''
  private messageType = MessageType.FAILURE
  private isSubmitting = false

  get submitUrl() {
    const token = AuthUtils.getTokenCookie()

    return `${apiHost}/wp-json/tuja/v1/questions/${this.questionId}/answer?token=${token}`
  }

  get viewEventUrl() {
    const token = AuthUtils.getTokenCookie()

    return `${apiHost}/wp-json/tuja/v1/questions/${this.questionId}/view-events?token=${token}`
  }

  async fetchQuestion() {
    try {
      this.isQuestionLoading = true

      this.question = null

      const token = AuthUtils.getTokenCookie()

      const resp = await fetch(
        `${apiHost}/wp-json/tuja/v1/questions/${this.questionId}?token=${token}`
      )
      if (resp.ok) {
        const payload = await resp.json()
        this.question = {
          ...payload
        }

        Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'fetched', 'question', {
          message: `Fetched question ${this.questionId}.`
        })
      } else {
        Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'failed', 'fetch', {
          message: `Could not fetch question ${this.questionId}.`,
          status: `Http response ${resp.status}.`
        })

        this.message = 'Oj då, appen kan inte läsa in kontrollen.'
        this.messageType = MessageType.FAILURE
      }
    } catch (e) {
      Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'failed', 'fetch', {
        message: `Could not fetch question ${this.questionId}. Reason: ${e.message}.`
      })

      this.message = 'Något gick fel. ' + e.message
      this.messageType = MessageType.FAILURE
    }
    this.isQuestionLoading = false
  }

  async mounted() {
    await this.fetchQuestion()
  }

  async postViewEvent() {
    this.isSubmitting = true
    try {
      const resp = await fetch(
        this.viewEventUrl,
        {
          method: 'POST'
        }
      )
      if (resp.ok) {
        this.onPostViewEventSuccess()
      } else {
        this.onPostViewEventFailure(new Error('Kunde inte visa fråga'))
      }
    } catch (e) {
      this.onPostViewEventFailure(e)
    }
    this.isSubmitting = false
  }

  async submitAnswer() {
    this.isSubmitting = true
    try {
      const formEl = document.querySelector('form')
      if (formEl) {
        const payload = new FormData(formEl)
        const resp = await fetch(
          this.submitUrl,
          {
            method: 'POST',
            body: payload
          }
        )
        if (resp.ok) {
          this.onSubmitSuccess()
        } else {
          this.onSubmitFailure(new Error('Kunde inte spara svar'))
        }
      }
    } catch (e) {
      this.onSubmitFailure(e)
    }
    this.isSubmitting = false
  }

  @Emit('submit-success')
  onSubmitSuccess() {
    Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'submitted', 'answer', {
      message: `Submitted answer to question ${this.questionId}.`
    })

    this.message = 'Ditt svar sparades'
    this.messageType = MessageType.INFO

    return true
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
.checkpoint-container {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  height: 100%;
  width: 100%;
}

.checkpoint-container > div {
  margin: 0px 10px;
}
</style>
