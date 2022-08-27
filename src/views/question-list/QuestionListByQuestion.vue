<template>
  <div>
    <div
      v-if="selectedQuestion"
      class="selected-question-group"
    >
      <Button
        @click="onDeselect"
        :pending="isBackPending"
        label="Tillbaka"
        type="secondary"
      />
      <QuestionGroupForm
        :question-group="selectedQuestionGroup"
        @submit-success="onSubmitSuccess"
      />
    </div>
    <div v-if="!selectedQuestion">
      <Card
        v-for="(question, index) in questions"
        :key="question.id"
        :verticalMargin="true"
      >
        <div class="question-wrapper">
          <Button
            @click="onSelect(question)"
            :label="getQuestionLabel(question, index)"
            :wide="true"
          />
          <div
            class="submitted-marker"
            v-if="isSubmitted(question)"
          >
            <font-awesome-icon icon="check" />
            Klar
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script lang="ts">
import { QuestionDto, ExtendedQuestionGroupDto } from '@/components/common/question/model'
import Button from '@/components/common/Button.vue'
import Card from '@/components/layout/Card.vue'
import { Component, Vue, Prop, Emit } from 'vue-property-decorator'
import QuestionGroupForm from '@/components/QuestionGroupForm.vue'
import * as Api from '@/utils/Api'

@Component({
  components: {
    QuestionGroupForm,
    Button,
    Card
  }
})
export default class QuestionListByQuestion extends Vue {
  @Prop() private questionGroups!: ExtendedQuestionGroupDto[]

  private selectedQuestion: QuestionDto | null = null
  private isBackPending: boolean = false

  get questions() {
    const questions = (this.questionGroups || []).map(({ questions }) => questions).reduce((all, some) => all.concat(some), [])
    return questions
  }

  get selectedQuestionGroup() {
    const questionGroup = this.questionGroups.find(qg => qg.questions.some(q => q.id === this.selectedQuestion?.id))
    return {
      ...questionGroup,
      questions: [this.selectedQuestion]
    }
  }

  getQuestionLabel(question: QuestionDto, index: number) {
    return `Uppgift ${question?.config?.name ?? (index + 1)}`
  }

  onSelect(question: QuestionDto) {
    this.selectedQuestion = question
  }

  async onDeselect() {
    this.isBackPending = true
    await Api.processQueue()
    this.isBackPending = false
    this.selectedQuestion = null
  }

  isSubmitted(question: QuestionDto) {
    return question.response.current_value !== null
  }

  @Emit('submit-success')
  onSubmitSuccess(updatedQuestionData: QuestionDto) {
    return updatedQuestionData
  }
}
</script>

<style scoped>
div.selected-question-group {
  margin-top: 10px;
}
div.question-wrapper {
  display: flex;
  flex-direction: row;
  align-items: center;
}
div.submitted-marker {
  flex: 0;
  margin-left: 20px;
  white-space: nowrap;
}
</style>