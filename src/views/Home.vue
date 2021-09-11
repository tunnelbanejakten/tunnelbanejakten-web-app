<template>
  <Page title="Svara">
    <div v-if="isLoadingQuestions">
      <Loader />
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
      <div
        class="question"
        v-for="question in questions"
        :key="question.id"
      >
        <QuestionForm
          :question="question"
          :question-id="question.id"
        />
      </div>
    </div>
  </Page>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Loader from '@/components/common/Loader.vue'
import Page from '@/components/layout/Page.vue'
import QuestionForm from '@/components/QuestionForm.vue'
import * as AuthUtils from '@/utils/Auth'
import * as Analytics from '@/utils/Analytics'
import { QuestionDto } from '@/components/common/question/model'
import Message, { Type as MessageType } from '@/components/common/Message.vue'

const apiHost = process.env.VUE_APP_API_HOST

@Component({
  components: {
    Page,
    QuestionForm,
    Loader,
    Message
  }
})
export default class Home extends Vue {
  private questions: QuestionDto[] = []
  private isLoadingQuestions = false

  private message = ''
  private messageType = MessageType.FAILURE

  async mounted() {
    const token = AuthUtils.getTokenCookie()
    if (token) {
      this.isLoadingQuestions = true
      this.message = ''
      try {
        const resp = await fetch(
          `${apiHost}/wp-json/tuja/v1/questions?token=${token}`
        )
        const payload = await resp.json()
        this.questions = []
        payload.forEach((formView: any) => {
          formView.question_groups.forEach((questionGroupView: any) => {
            this.questions.push(...questionGroupView.questions)
          })
        })

        if (!this.questions.length) {
          this.message = 'Det finns inga uppgifter att besvara just nu.'
          this.messageType = MessageType.INFO
        }
      } catch (e) {
        Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'failed', 'fetch', {
          message: `Could not fetch questions. Reason: ${e.message}.`
        })

        this.message = e.message
        this.messageType = MessageType.FAILURE
      }
      this.isLoadingQuestions = false
    }
  }
}
</script>

<style scoped>
.question {
  border: 1px solid #ccc;
  border-radius: 5px;
  margin: 10px 0;
  padding: 0 10px 10px 10px;
}
div.map-link-wrapper {
  font-size: 90%;
  font-style: italic;
}
</style>
