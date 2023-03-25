<template>
  <div>
    <Card
      v-for="(questionGroup, index) in groups"
      :key="questionGroup.id"
      :verticalMargin="true"
    >
      <div class="question-wrapper">
        <Button
          @click="onSelect(questionGroup)"
          :label="getQuestionGroupLabel(questionGroup, index)"
          :wide="true"
        />
        <div
          class="submitted-marker"
          v-if="submittedRatio(questionGroup)"
        >
          <font-awesome-icon icon="check" />
          <span v-if="submittedRatio(questionGroup) === 100"> Klar</span>
          <span v-if="submittedRatio(questionGroup) !== 100"> {{ submittedRatio(questionGroup) }} % klar</span>
        </div>
      </div>
    </Card>
  </div>
</template>

<script lang="ts">
import { ExtendedQuestionGroupDto } from '@/components/common/question/model'
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
export default class QuestionListByGroup extends Vue {
  get groups() {
    return store.state.answers.questionGroups || []
  }

  getQuestionGroupLabel(questionGroup: ExtendedQuestionGroupDto, index: number) {
    return questionGroup.name || `Block ${index + 1}`
  }

  onSelect(questionGroup: ExtendedQuestionGroupDto) {
    this.$router.push({ name: 'AnswerQuestionGroup', params: { questionGroupId: String(questionGroup.id) } })
  }

  submittedRatio(questionGroup: ExtendedQuestionGroupDto) {
    const answeredQuestions = questionGroup.questions.filter(question => question.response.current_value !== null).length
    const countQuestions = questionGroup.questions.length
    return Math.round(100 * (countQuestions > 0 ? answeredQuestions / countQuestions : 0))
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