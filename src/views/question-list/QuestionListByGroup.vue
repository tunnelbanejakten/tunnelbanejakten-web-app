<template>
  <div>
    <div
      v-if="selectedGroup"
      class="selected-question-group"
    >
      <Button
        @click="onDeselect"
        :pending="isBackPending"
        label="Tillbaka"
        type="secondary"
      />
      <QuestionGroupForm
        :question-group="selectedGroup"
        @submit-success="onSubmitSuccess"
      />
    </div>
    <div v-if="!selectedGroup">
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
  </div>
</template>

<script lang="ts">
import { QuestionDto, QuestionGroupDto } from '@/components/common/question/model'
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
export default class QuestionListByGroup extends Vue {
  @Prop() private questionGroups!: QuestionGroupDto[]

  private selectedGroup: QuestionGroupDto | null = null
  private isBackPending: boolean = false

  get groups() {
    return this.questionGroups || []
  }

  getQuestionGroupLabel(questionGroup: QuestionGroupDto, index: number) {
    return questionGroup.name || `Block ${index + 1}`
  }

  onSelect(questionGroup: QuestionGroupDto) {
    this.selectedGroup = questionGroup
  }

  async onDeselect() {
    this.isBackPending = true
    await Api.processQueue()
    this.isBackPending = false
    this.selectedGroup = null
  }

  submittedRatio(questionGroup: QuestionGroupDto) {
    const answeredQuestions = questionGroup.questions.filter(question => question.response.current_value !== null).length
    const countQuestions = questionGroup.questions.length
    return Math.round(100 * (countQuestions > 0 ? answeredQuestions / countQuestions : 0))
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