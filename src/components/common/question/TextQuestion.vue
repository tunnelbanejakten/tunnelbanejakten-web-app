<template>
  <div class="input-wrapper">
    <input
      type="text"
      :readonly="readOnly"
      :disabled="readOnly"
      v-model="fieldValue"
    >
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit } from 'vue-property-decorator'
import Page from '@/components/layout/Page.vue'
import Wrapper from './Question.vue'
import { FormUpdate, QuestionDto } from './model'

@Component({
  components: {
    Page,
    Wrapper
  }
})
export default class TextQuestion extends Vue {
  @Prop() private question!: QuestionDto;
  @Prop() private readOnly!: boolean;

  private fieldValue: string = ''

  get optionType() {
    return this.question.config?.is_single_select ? 'radio' : 'checkbox'
  }

  get possibleAnswers() {
    return this.question.config?.possible_answers || []
  }

  get fieldName() {
    return this.question.response.field_name
  }

  created() {
    this.fieldValue = this.question &&
      this.question.response &&
      this.question.response.current_value
      ? this.question.response.current_value[0]
      : ''
    this.$watch('fieldValue', this.onChange)
  }

  @Emit('change')
  onChange() {
    return {
      updatedFields: [{
        key: this.fieldName,
        value: this.fieldValue
      }]
    } as FormUpdate
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
