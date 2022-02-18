<template>
  <div>
    <div
      v-for="opt in possibleAnswers"
      class="option"
      :key="opt"
    >
      <label>
        <input
          :type="optionType"
          :readonly="readOnly"
          :disabled="readOnly"
          :value="opt"
          :checked="fieldValues.includes(opt)"
          :name="fieldName"
          @change="onChange"
        >
        {{ opt }}
      </label>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit } from 'vue-property-decorator'
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
  @Prop() private readOnly!: boolean;

  get optionType() {
    return this.question.config?.is_single_select ? 'radio' : 'checkbox'
  }

  get possibleAnswers() {
    return this.question.config?.possible_answers || []
  }

  get fieldName() {
    return (
      this.question.response.field_name +
      (!this.question.config?.is_single_select ? '[]' : '')
    )
  }

  get fieldValues() {
    return this.question &&
      this.question.response &&
      this.question.response.current_value
      ? this.question.response.current_value
      : []
  }

  @Emit('change')
  onChange() {
    return true
  }
}
</script>

<style scoped>
div.option label {
  display: block;
  width: 100%;
  line-height: 36px;
  padding: 0 5px;
}
div.option {
  border: 1px solid #bbb;
  border-width: 1px 1px 0 1px;
}
div.option:first-child {
  border-radius: 5px 5px 0 0;
}
div.option:last-child {
  border-radius: 0 0 5px 5px;
  border-width: 1px 1px 1px 1px;
}
</style>
