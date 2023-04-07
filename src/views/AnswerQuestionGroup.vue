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
        :question-group="questionGroup"
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
export default class AnswerQuestionGroup extends Vue {
  private isBackPending: boolean = false
  private questionGroupId = 0

  async mounted() {
    this.questionGroupId = parseInt(this.$route.params?.questionGroupId || '0')
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

  get questionGroup(): ExtendedQuestionGroupDto | null {
    return store.state.answers.questionGroups
      .find((questionGroup: ExtendedQuestionGroupDto) => questionGroup.id === this.questionGroupId) ?? null
  }
}
</script>

<style scoped>
</style>
