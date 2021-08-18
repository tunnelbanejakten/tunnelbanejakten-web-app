<template>
  <div>
    <div
      v-for="opt in possibleAnswers"
      :key="opt"
    >
      <label>
        <input
          :type="optionType"
          :value="opt"
          :checked="fieldValues.includes(opt)"
          :name="fieldName"
        >
        {{ opt }}
      </label>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import Page from '@/components/layout/Page.vue'
import Wrapper from './Question.vue'
import { QuestionDto } from './model'

@Component({
  components: {
    Page,
    Wrapper
  }
})
export default class OptionsQuestion extends Vue {
  @Prop() private question!: QuestionDto;

  get optionType() {
    return this.question.config?.is_single_select ? 'radio' : 'checkbox'
  }

  get possibleAnswers() {
    return this.question.config?.possible_answers || []
  }

  get fieldName() {
    return this.question.response.field_name + '[]'
  }

  get fieldValues() {
    return this.question && this.question.response && this.question.response.current_value ? this.question.response.current_value : []
  }
}
</script>

<style scoped>
</style>
