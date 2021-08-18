<template>
  <div>
    <div
      class="question"
      v-if="!isQuestionAvailable"
    >
      <p>
        Det här är en tidsbegränsad uppgift.
      </p>
      <p>
        Ni har {{ timeLimitHumanReadable }} på er från att uppgiften visas.
      </p>
      <div class="buttons">
        <Button
          label="Visa uppgift"
          :pending="isSubmitting"
          @click="onUserAccept"
        />
      </div>
    </div>
    <div
      class="question"
      v-if="isQuestionAvailable"
    >
      <p class="text">
        {{ text }}
      </p>

      <component
        :is="currentComponent()"
        :question="question"
      />

      <p
        class="text-hint"
        v-if="!!textHint"
      >
        {{ textHint }}
      </p>
      <div v-if="!isTimeLimitExceeded">
        <p
          class="time-status"
          v-if="isTimedQuestion"
        >
          Det är {{ timeLeftHumanReadable }} kvar.
        </p>
        <input
          type="hidden"
          :name="optimisticLockFieldName"
          :value="optimisticLockCurrentValue"
        >
        <input
          type="hidden"
          :name="trackedAnswersFieldName"
          :value="trackedAnswersCurrentValue"
        >
        <Button
          @click="onSubmitAnswer"
          :pending="isSubmitting"
          label="Spara"
          type="primary"
        />
        <p class="time-status">
          Ni kan uppdatera ert svar genom att trycka på Spara igen.
        </p>
      </div>
      <div v-if="isTimeLimitExceeded">
        <p class="time-status">
          Tiden har gått ut. Ni kan inte längre ändra ert svar.
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit, Watch } from 'vue-property-decorator'
import { QuestionDto } from './model'
import Button from '@/components/common/Button.vue'
import OptionsQuestion from '@/components/common/question/OptionsQuestion.vue'
import TextQuestion from '@/components/common/question/TextQuestion.vue'

@Component({
  components: {
    Button,
    OptionsQuestion,
    TextQuestion
  }
})
export default class Question extends Vue {
  @Prop() private question!: QuestionDto;
  @Prop() private isSubmitting!: boolean;

  private countdownTimer = 0
  private timeLeft = 0
  private endTime = 0

  currentComponent() {
    return this.question?.type
  }

  updateTimeLeft() {
    this.timeLeft = Math.round((this.endTime - Date.now()) / 1000)
  }

  @Watch('question')
  onQuestionUpdated() {
    this.init()
  }

  init() {
    console.log('🏁 Init')
    if (this.isTimedQuestion) {
      console.log('🕰 Timed question. Seconds left:', this.question.limit_time_remaining)
      this.endTime = Date.now() + (this.question.limit_time_remaining || 0) * 1000
      this.updateTimeLeft()
      if (this.timeLeft > 0) {
        this.countdownTimer = setInterval(() => {
          this.updateTimeLeft()
          if (this.timeLeft > 0) {
            console.log('🕰 Time left:', this.timeLeft)
          } else {
            console.log('🕰 Time is up')
            this.stopCountdownTimer()
          }
        }, 1000)
      }
    }
  }

  mounted() {
    this.init()
  }

  beforeDestroy() {
    this.stopCountdownTimer()
  }

  stopCountdownTimer() {
    console.log('🕰 Stop timer')
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer)
      this.countdownTimer = 0
    }
  }

  get isViewEventRequired() {
    return this.question.view_event?.is_required || false
  }

  get isViewEventFound() {
    return this.question.view_event?.is_found || false
  }

  get isTimedQuestion() {
    return this.isViewEventRequired
  }

  get isTimeLimitExceeded() {
    return this.isTimedQuestion && (this.timeLeft <= 0 || (this.question.limit_time_remaining || 0) <= 0)
  }

  get isQuestionAvailable() {
    return !this.isViewEventRequired || this.isViewEventFound
  }

  get timeLimit() {
    return this.isViewEventRequired && this.question.limit_time_max > 0 ? this.question.limit_time_max : 0
  }

  fuzzyTime(seconds: number, roundMinutes: boolean) {
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    if (min === 0) {
      return `${seconds} sekunder`
    } else {
      if (min < 3 || !roundMinutes) {
        return sec ? `${min} minuter och ${sec} sekunder` : `${min} minuter`
      } else {
        const roundedMin = Math.round(seconds / 60)
        return `ungefär ${roundedMin} minuter`
      }
    }
  }

  get timeLimitHumanReadable() {
    return this.fuzzyTime(this.timeLimit, false)
  }

  get timeLeftHumanReadable() {
    return this.fuzzyTime(this.timeLeft, true)
  }

  get text() {
    return this.question.config?.text
  }

  get textHint() {
    return this.question.config?.text_hint
  }

  get optimisticLockCurrentValue() {
    return this.question ? this.question.optimistic_lock.current_value : -1
  }

  get optimisticLockFieldName() {
    return this.question
      ? this.question.optimistic_lock.field_name
      : 'untitled'
  }

  get trackedAnswersCurrentValue() {
    return this.question ? this.question.tracked_answers.current_value : -1
  }

  get trackedAnswersFieldName() {
    return this.question
      ? this.question.tracked_answers.field_name
      : 'untitled'
  }

  @Emit('user-accepts-time-limit')
  onUserAccept() {
    return true
  }

  @Emit('user-submits-answer')
  onSubmitAnswer() {
    return true
  }
}
</script>

<style scoped>
p.time-status {
  font-size: 90%;
  font-style: italic;
}
p.text {
}
p.text-hint {
  font-size: 90%;
  font-style: italic;
}
</style>
