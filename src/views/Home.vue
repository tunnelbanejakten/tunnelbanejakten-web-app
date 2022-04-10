<template>
  <Page title="Svara">
    <div
      class="no-questions"
      v-if="isLoadingQuestions"
    >
      <Loader message="Hämtar frågor" />
    </div>
    <div v-if="!isLoadingQuestions">
      <div class="map-link-wrapper">
        Fler uppgifter hittar ni på
        <router-link to="/map">
          <span>kartan</span>
        </router-link>.
      </div>
      <div v-if="!!message">
        <Message
          header="Oj då"
          :message="message"
          :type="messageType"
        />
      </div>
      <component
        :is="currentComponent"
        :question-groups="questionGroups"
      />
    </div>
  </Page>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Loader from '@/components/common/Loader.vue'
import Page from '@/components/layout/Page.vue'
import QuestionForm from '@/components/QuestionForm.vue'
import QuestionListFlat from '@/views/question-list/QuestionListFlat.vue'
import QuestionListByGroup from '@/views/question-list/QuestionListByGroup.vue'
import QuestionListByQuestion from '@/views/question-list/QuestionListByQuestion.vue'
import * as Analytics from '@/utils/Analytics'
import * as Api from '@/utils/Api'
import { FormDto, QuestionGroupDto, ExtendedQuestionGroupDto } from '@/components/common/question/model'
import Message, { Type as MessageType } from '@/components/common/Message.vue'
import store, { QuestionGrouping } from '@/store'

const apiHost = process.env.VUE_APP_API_HOST

@Component({
  components: {
    Page,
    QuestionForm,
    Loader,
    Message,
    QuestionListFlat,
    QuestionListByGroup,
    QuestionListByQuestion
  }
})
export default class Home extends Vue {
  private questionGroups: ExtendedQuestionGroupDto[] = []
  private isLoadingQuestions = false

  private message = ''
  private messageType = MessageType.FAILURE

  async mounted() {
    this.isLoadingQuestions = true
    this.message = ''
    try {
      const resp = await Api.call({
        endpoint: `${apiHost}/wp-json/tuja/v1/questions`
      })
      const payload = resp.payload
      this.questionGroups = []
      payload.forEach((formView: FormDto) => {
        formView.question_groups.forEach((questionGroupView: QuestionGroupDto) => {
          if (questionGroupView.questions && questionGroupView.questions.length) {
            this.questionGroups.push({
              ...questionGroupView,
              isReadOnly: formView.is_read_only
            })
          }
        })
      })

      if (!this.questionGroups.length) {
        this.message = 'Det finns inga uppgifter att besvara just nu.'
        this.messageType = MessageType.INFO
      }
    } catch (e: any) {
      Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'failed', 'fetch', {
        message: `Could not fetch questions. Reason: ${e.message}.`
      })

      this.message = e.message
      this.messageType = MessageType.FAILURE
    }
    this.isLoadingQuestions = false
  }

  get questionGrouping() {
    return store.state.configuration.answer.questionGrouping
  }

  get currentComponent() {
    if (this.questionGrouping === QuestionGrouping.BY_QUESTION_GROUP) {
      return 'QuestionListByGroup'
    } else if (this.questionGrouping === QuestionGrouping.BY_QUESTION) {
      return 'QuestionListByQuestion'
    } else {
      return 'QuestionListFlat'
    }
  }
}
</script>

<style scoped>
.no-questions {
  display: flex;
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: center;
}

div.map-link-wrapper {
  font-size: 90%;
  font-style: italic;
}
</style>
