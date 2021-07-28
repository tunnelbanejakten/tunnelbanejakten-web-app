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
      <div v-if="!isQuestionLoading && question">
        <form>
          <component
            :is="currentComponent()"
            :question="question"
          />
          <input
            type="hidden"
            :name="optimisticLockFieldName"
            :value="optimisticLockCurrentValue"
          >
          <input
            type="hidden"
            :name="trackedAnswersFieldName"
            :value="trackedAnswersCurrentValue"
          >
          <div>
            <Button
              @click="onSubmitAnswer"
              :pending="isSubmitting"
              label="Spara"
              type="primary"
            />
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Emit, Prop } from 'vue-property-decorator'
import Button from '@/components/common/Button.vue'
import Message, { Type as MessageType } from '@/components/common/Message.vue'
import OptionsQuestion from '@/components/common/question/OptionsQuestion.vue'
import TextQuestion from '@/components/common/question/TextQuestion.vue'
import * as AuthUtils from '@/utils/Auth'

const apiHost = process.env.VUE_APP_API_HOST

@Component({
  components: {
    OptionsQuestion,
    TextQuestion,
    Button,
    Message
  }
})
export default class Checkpoint extends Vue {
  @Prop() private readonly questionId!: string

  private question: any = null

  private isQuestionLoading = false
  private isSubmitting = false

  private message = ''
  private messageType = MessageType.FAILURE

  currentComponent() {
    return this.question?.type
  }

  get optimisticLockCurrentValue() {
    return this.question ? this.question.optimistic_lock.current_value : -1
  }

  get optimisticLockFieldName() {
    return this.question
      ? this.question.optimistic_lock.field_name
      : 'untitled'
  }

  get trackedAnswersCurrentValue() {
    return this.question ? this.question.tracked_answers.current_value : -1
  }

  get trackedAnswersFieldName() {
    return this.question
      ? this.question.tracked_answers.field_name
      : 'untitled'
  }

  async mounted() {
    try {
      this.isQuestionLoading = true

      this.question = null

      const token = AuthUtils.getTokenCookie()

      const resp = await fetch(
        `${apiHost}/wp-json/tuja/v1/questions/${this.questionId}?token=${token}`
      )
      const payload = await resp.json()
      this.question = {
        ...payload
      }
    } catch (e) {
      this.message = 'Något gick fel. ' + e.message
      this.messageType = MessageType.FAILURE
    }
    this.isQuestionLoading = false
  }

  async onSubmitAnswer() {
    this.isSubmitting = true
    try {
      const token = AuthUtils.getTokenCookie()

      const formEl = document.querySelector('form')
      if (formEl) {
        const payload = new FormData(formEl)
        const resp = await fetch(
          `${apiHost}/wp-json/tuja/v1/questions/${this.questionId}/answer?token=${token}`,
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
    this.message = 'Ditt svar sparades'
    this.messageType = MessageType.INFO

    return true
  }

  @Emit('submit-failure')
  onSubmitFailure(error: any) {
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
