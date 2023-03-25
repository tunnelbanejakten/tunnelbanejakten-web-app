<template>
  <div>
    <QuestionGroupForm
      v-for="questionGroup in groups"
      :key="questionGroup.id"
      :question-group="questionGroup"
      @submit-success="onSubmitSuccess"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { QuestionDto } from '@/components/common/question/model'
import QuestionGroupForm from '@/components/QuestionGroupForm.vue'
import store from '@/store'

@Component({
  components: {
    QuestionGroupForm
  }
})
export default class QuestionListFlat extends Vue {

  get groups() {
    return store.state.answers.questionGroups || []
  }

  onSubmitSuccess(updatedQuestionData: QuestionDto) {
    store.updateQuestion(updatedQuestionData)
  }
}
</script>

<style scoped>
</style>