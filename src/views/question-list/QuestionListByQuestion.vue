<template>
  <div>
    <div v-if="selectedQuestion" class="selected-question-group">
      <Button
        @click="onDeselect()"
        label="Tillbaka"
        type="secondary"
      />
      <QuestionListFlat :question-groups="selectedQuestionGroup" />
    </div>
    <div v-if="!selectedQuestion">
      <div
        v-for="(question, index) in questions"
        :key="question.id"
        class="question-group-selector"
      >
        <Button
          @click="onSelect(question)"
          :label="getQuestionLabel(question, index)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { QuestionDto, QuestionGroupDto } from '@/components/common/question/model'
import Button from '@/components/common/Button.vue'
import { Component, Vue, Prop } from 'vue-property-decorator'
import QuestionListFlat from '@/views/question-list/QuestionListFlat.vue'

@Component({
  components: {
    QuestionListFlat,
    Button
  }
})
export default class QuestionListByQuestion extends Vue {
  @Prop() private questionGroups!: QuestionGroupDto[]

  private selectedQuestion: QuestionDto | null = null

  get questions() {
    const questions = (this.questionGroups || []).map(({questions}) => questions).reduce((all, some) => all.concat(some), [])
    return questions
  }

  get selectedQuestionGroup() {
    return [{
      description: null,
      id: -1,
      name: null,
      questions: [this.selectedQuestion]
    }]
  }

  getQuestionLabel(questionGroup: QuestionGroupDto, index: number) {
    return questionGroup.name || `Fråga ${index + 1}`
  }

  onSelect(question: QuestionDto) {
    this.selectedQuestion = question
  }

  onDeselect() {
    this.selectedQuestion = null
  }
}
</script>

<style scoped>
div.selected-question-group,
div.question-group-selector {
    margin-top: 10px;
}
</style>