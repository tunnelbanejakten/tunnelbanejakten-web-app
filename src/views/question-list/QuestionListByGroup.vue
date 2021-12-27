<template>
  <div>
    <div v-if="selectedGroup" class="selected-question-group">
      <Button
        @click="onDeselect()"
        label="Tillbaka"
        type="secondary"
      />
      <QuestionListFlat :question-groups="[selectedGroup]" />
    </div>
    <div v-if="!selectedGroup">
      <div
        v-for="(questionGroup, index) in questions"
        :key="questionGroup.id"
        class="question-group-selector"
      >
        <Button
          @click="onSelect(questionGroup)"
          :label="getQuestionGroupLabel(questionGroup, index)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { QuestionGroupDto } from '@/components/common/question/model'
import Button from '@/components/common/Button.vue'
import { Component, Vue, Prop } from 'vue-property-decorator'
import QuestionListFlat from '@/views/question-list/QuestionListFlat.vue'

@Component({
  components: {
    QuestionListFlat,
    Button
  }
})
export default class QuestionListByGroup extends Vue {
  @Prop() private questionGroups!: QuestionGroupDto[]

  private selectedGroup: QuestionGroupDto | null = null

  get questions() {
    return this.questionGroups || []
  }

  getQuestionGroupLabel(questionGroup: QuestionGroupDto, index: number) {
    return questionGroup.name || `Block ${index + 1}`
  }

  onSelect(questionGroup: QuestionGroupDto) {
    this.selectedGroup = questionGroup
  }

  onDeselect() {
    this.selectedGroup = null
  }
}
</script>

<style scoped>
div.selected-question-group,
div.question-group-selector {
    margin-top: 10px;
}
</style>