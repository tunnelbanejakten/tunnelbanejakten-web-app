<template>
  <Card :verticalMargin="true">
    <div
      class="question-group-header"
      v-if="questionGroup.name || questionGroup.description"
    >
      <div
        v-if="questionGroup.name"
        class="name"
      >
        {{ questionGroup.name }}
      </div>
      <div
        v-if="questionGroup.description"
        v-html="questionGroup.description"
        class="description"
      />
    </div>
    <div class="question-group-questions">
      <div
        class="question"
        v-for="question in questionGroup.questions"
        :key="questionKey(question)"
      >
        <QuestionForm
          :question="question"
          :question-id="question.id"
          :read-only="questionGroup.isReadOnly"
          @submit-success="onSubmitSuccess"
          @post-view-event-success="onPostViewEventSuccess"
          @question-fetched="onQuestionFetched"
        />
      </div>
    </div>
  </Card>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { QuestionDto, ExtendedQuestionGroupDto } from '@/components/common/question/model'
import Card from '@/components/layout/Card.vue'
import QuestionForm from '@/components/QuestionForm.vue'

@Component({
  components: {
    QuestionForm,
    Card
  }
})
export default class QuestionGroupForm extends Vue {
  @Prop() private questionGroup!: ExtendedQuestionGroupDto

  questionKey(question: QuestionDto) {
    return JSON.stringify({
      r: question.response,
      c: question.config
    })
  }

  onSubmitSuccess(updatedQuestionData: QuestionDto) {
    const index = this.questionGroup.questions.findIndex(q => q.id === updatedQuestionData.id)
    if (index !== -1) {
      const updatedQuestion = updatedQuestionData
      this.questionGroup.questions.splice(index, 1, updatedQuestion)
    }
    return updatedQuestionData
  }

  onPostViewEventSuccess(questionId: string) {
    const qId = parseInt(questionId, 10)
    const index = this.questionGroup.questions.findIndex(q => q.id === qId)
    if (index !== -1) {
      this.questionGroup.questions[index].view_event.is_found = true
    }
    return questionId
  }

  onQuestionFetched(updatedQuestionData: QuestionDto) {
    const index = this.questionGroup.questions.findIndex(q => q.id === updatedQuestionData.id)
    if (index !== -1) {
      this.questionGroup.questions.splice(index, 1, updatedQuestionData)
    }
  }
}
</script>

<style scoped>
div.name {
  font-size: 110%;
}
div.question-group-header {
  border-bottom: 5px solid #ddd;
  margin-bottom: 15px;
}
div.question-group-header div.name,
div.question-group-header div.description::v-deep p {
  margin: 0;
  padding: 0 0 20px 0;
}
div.question-group-header::v-deep .description img,
div.question-group-questions::v-deep .description img {
  max-width: 100%;
}
div.question {
  border-top: 5px solid #ddd;
  margin: 15px 0 0 0;
  padding: 15px 0 0 0;
}
div.question:first-child {
  border-top: none;
  margin-top: 0;
  padding-top: 0;
}
</style>