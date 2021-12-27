<template>
  <div>
    <QuestionGroupForm
      v-for="questionGroup in groups"
      :key="questionGroup.id"
      :question-group="questionGroup"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { QuestionGroupDto } from '@/components/common/question/model'
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
}
</script>

<style scoped>
</style>