<template>
  <div class="input-wrapper">
    <input
      type="text"
      :readonly="readOnly"
      :disabled="readOnly"
      :value="fieldValue"
      :name="fieldName"
      @change="onChange"
      @keypress="onChange"
    >
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
export default class TextQuestion extends Vue {
  @Prop() private question!: QuestionDto;
  @Prop() private readOnly!: boolean;

  get optionType() {
    return this.question.config?.is_single_select ? 'radio' : 'checkbox'
  }

  get possibleAnswers() {
    return this.question.config?.possible_answers || []
  }

  get fieldName() {
    return this.question.response.field_name
  }

  get fieldValue() {
    return this.question && this.question.response && this.question.response.current_value ? this.question.response.current_value[0] : ''
  }

  @Emit('change')
  onChange() {
    return true
  }
}
</script>

<style scoped>
input {
  box-sizing: border-box;
  width: 100%;
  margin: 5px 0px 5px 0px;
  padding: 10px;
  border: 1px solid #bbb;
  border-radius: 5px;

  font: 16px/1.4 "Open Sans", Tahoma, Verdana, Segoe, sans-serif;
}
</style>
