<template>
  <div>
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
</template>

<script lang="ts">
import { QuestionDto } from '@/components/common/question/model'
import Button from '@/components/common/Button.vue'
import Card from '@/components/layout/Card.vue'
import { Component, Vue } from 'vue-property-decorator'
import QuestionGroupForm from '@/components/QuestionGroupForm.vue'
import store from '@/store'

@Component({
  components: {
    QuestionGroupForm,
    Button,
    Card
  }
})
export default class QuestionListByQuestion extends Vue {
  get questions() {
    const questionGroups = store.state.answers.questionGroups || []
    return questionGroups
      .map(({ questions }) => questions)
      .reduce((all, some) => all.concat(some), [])
  }

  getQuestionLabel(question: QuestionDto, index: number) {
    return `Uppgift ${question?.config?.name ?? (index + 1)}`
  }

  onSelect(question: QuestionDto) {
    this.$router.push({ name: 'AnswerQuestion', params: { questionId: String(question.id) } })
  }

  isSubmitted(question: QuestionDto) {
    return question.response.current_value !== null
  }
}
</script>

<style scoped>
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