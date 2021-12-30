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
import { Component, Vue, Prop, Emit } from 'vue-property-decorator'
import { QuestionDto, QuestionGroupDto } from '@/components/common/question/model'
import QuestionGroupForm from '@/components/QuestionGroupForm.vue'

@Component({
  components: {
    QuestionGroupForm
  }
})
export default class QuestionListFlat extends Vue {
  @Prop() private questionGroups!: QuestionGroupDto[]

  get groups() {
    return this.questionGroups || []
  }

  @Emit('submit-success')
  onSubmitSuccess(updatedQuestionData: QuestionDto) {
    return updatedQuestionData
  }
}
</script>

<style scoped>
</style>