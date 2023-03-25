<template>
  <Page
    title="Svara"
    :noPadding="true"
  >
    <QuestionViewWrapper>
      <Button
        @click="onBack"
        :pending="isBackPending"
        label="Tillbaka"
        type="secondary"
      />
      <QuestionGroupForm
        :question-group="questionGroupSelectedQuestion"
        @submit-success="onSubmitSuccess"
      />
    </QuestionViewWrapper>
  </Page>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Button from '@/components/common/Button.vue'
import Page from '@/components/layout/Page.vue'
import QuestionForm from '@/components/QuestionForm.vue'
import QuestionViewWrapper from '@/views/answer/QuestionViewWrapper.vue'
import QuestionGroupForm from '@/components/QuestionGroupForm.vue'
import * as Api from '@/utils/Api'
import { ExtendedQuestionGroupDto, QuestionDto } from '@/components/common/question/model'
import Message from '@/components/common/Message.vue'
import store from '@/store'
@Component({
  components: {
    Page,
    QuestionForm,
    Button,
    Message,
    QuestionGroupForm,
    QuestionViewWrapper
  }
})
export default class AnswerSingleQuestion extends Vue {
  private questionId = 0
  private isBackPending: boolean = false

  async mounted() {
    this.questionId = parseInt(this.$route.params?.questionId || '0')
  }

  async onBack() {
    this.isBackPending = true
    await Api.processQueue()
    this.isBackPending = false
    this.$router.push({ name: 'Answer' })
  }

  onSubmitSuccess(updatedQuestionData: QuestionDto) {
    store.updateQuestion(updatedQuestionData)
  }

  get questionGroupSelectedQuestion(): ExtendedQuestionGroupDto | null {
    for (const questionGroup of store.state.answers.questionGroups) {
      for (const question of questionGroup.questions) {
        if (question.id === this.questionId) {
          return {
            ...questionGroup,
            questions: [question]
          }
        }
      }
    }
    return null
  }
}
</script>

<style scoped>
</style>
