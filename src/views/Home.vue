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
        class="question-group"
        v-for="questionGroup in questionGroups"
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
  </Page>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Loader from '@/components/common/Loader.vue'
import Page from '@/components/layout/Page.vue'
import QuestionForm from '@/components/QuestionForm.vue'
import * as AuthUtils from '@/utils/Auth'
import * as Analytics from '@/utils/Analytics'
import { QuestionDto, QuestionGroupDto } from '@/components/common/question/model'
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
  private questionGroups: QuestionGroupDto[] = []
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
        this.questionGroups = []
        payload.forEach((formView: any) => {
          formView.question_groups.forEach((questionGroupView: any) => {
            if (questionGroupView.questions && questionGroupView.questions.length) {
              this.questionGroups.push(questionGroupView)
            }
          })
        })

        if (!this.questionGroups.length) {
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
div.question-group .description > p > img {
  max-width: 100%;
}
div.question-group div.name,
div.question-group div.description {
  margin-top: 0;
  padding: 0;
}
div.map-link-wrapper {
  font-size: 90%;
  font-style: italic;
}
</style>
