<template>
  <Page
    title="Svara"
    :noPadding="true"
  >
    <QuestionViewWrapper>
      <div class="map-link-wrapper">
        Ni hittar också uppgifter på
        <router-link to="/map">
          <span>kartan</span>
        </router-link>.
      </div>

      <QuestionListFlat
        :question-groups="questionGroups"
        v-if="isFlatListViewEnabled"
      />
      <QuestionListByGroup
        :question-groups="questionGroups"
        v-if="isByQuestionGroupViewEnabled"
      />
      <QuestionListByQuestion
        :question-groups="questionGroups"
        v-if="isByQuestionViewEnabled"
      />
    </QuestionViewWrapper>
  </Page>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Button from '@/components/common/Button.vue'
import Page from '@/components/layout/Page.vue'
import QuestionForm from '@/components/QuestionForm.vue'
import QuestionViewWrapper from '@/views/answer/QuestionViewWrapper.vue'
import QuestionListFlat from '@/views/answer/QuestionListFlat.vue'
import QuestionListByGroup from '@/views/answer/QuestionListByGroup.vue'
import QuestionListByQuestion from '@/views/answer/QuestionListByQuestion.vue'
import QuestionGroupForm from '@/components/QuestionGroupForm.vue'
import Message from '@/components/common/Message.vue'
import store, { QuestionGrouping } from '@/store'
@Component({
  components: {
    Page,
    QuestionForm,
    Button,
    Message,
    QuestionListFlat,
    QuestionListByGroup,
    QuestionListByQuestion,
    QuestionGroupForm,
    QuestionViewWrapper
  }
})
export default class AnswerMainPage extends Vue {
  get questionGroups() {
    return store.state.answers.questionGroups
  }

  get questionGrouping() {
    return store.state.configuration.answer.questionGrouping
  }

  get isByQuestionGroupViewEnabled(): boolean {
    return this.questionGrouping === QuestionGrouping.BY_QUESTION_GROUP
  }

  get isByQuestionViewEnabled(): boolean {
    return this.questionGrouping === QuestionGrouping.BY_QUESTION
  }

  get isFlatListViewEnabled(): boolean {
    return this.questionGrouping === QuestionGrouping.NONE
  }
}
</script>

<style scoped>
div.map-link-wrapper {
  font-size: 90%;
  font-style: italic;
}
</style>
