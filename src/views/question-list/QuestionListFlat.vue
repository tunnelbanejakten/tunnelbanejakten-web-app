<template>
  <div>
    <div
      class="question-group"
      v-for="questionGroup in questions"
      :key="questionGroup.id"
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
      <div>
        <div
          class="question"
          v-for="question in questionGroup.questions"
          :key="question.id"
        >
          <QuestionForm
            :question="question"
            :question-id="question.id"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { QuestionDto, QuestionGroupDto } from '@/components/common/question/model'
import QuestionForm from '@/components/QuestionForm.vue'

@Component({
  components: {
    QuestionForm
  }
})
export default class QuestionListFlat extends Vue {
  @Prop() private questionGroups!: QuestionGroupDto[]

  get questions() {
    return this.questionGroups || []
  }
}
</script>

<style scoped>
div.question {
  border-top: 1px solid #ccc;
  margin: 15px 0 0 0;
  padding: 15px 0 0 0;
}
div.question:first-child {
  border-top: none;
  margin-top: 0;
  padding-top: 0;
}
div.question-group {
  background-color: #fff;
  border-radius: 10px;
  margin: 15px 0;
  padding: 15px;
}
div.question-group::v-deep .description img {
  max-width: 100%;
}
div.question-group div.name,
div.question-group div.description {
  margin-top: 0;
  padding: 0;
}
</style>