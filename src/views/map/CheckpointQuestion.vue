<template>
  <div class="checkpoint-container">
    <QuestionForm
      :question-id="questionId"
      :duel-name="duelName"
      :read-only="readOnly"
      :fullScreen="true"
      @submit-success="onSubmitSuccess"
      @submit-failure="onSubmitFailure"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit } from 'vue-property-decorator'
import QuestionForm from '@/components/QuestionForm.vue'
import { QuestionDto } from '@/components/common/question/model'

@Component({
  components: {
    QuestionForm
  }
})
export default class CheckpointQuestion extends Vue {
  @Prop() private readonly questionId!: string
  @Prop() private readonly duelName!: string
  @Prop() private readonly readOnly!: boolean

  @Emit('submit-success')
  onSubmitSuccess(updatedQuestionData: QuestionDto) {
    return updatedQuestionData
  }

  @Emit('submit-failure')
  onSubmitFailure(error: any) {
    return error
  }
}
</script>

<style scoped>
.checkpoint-container {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  height: 100%;
  width: 100%;
}

.checkpoint-container > div {
  margin: 0px 10px;
}
</style>
