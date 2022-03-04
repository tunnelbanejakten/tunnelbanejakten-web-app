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
import { FormUpdate, QuestionResponseDto } from './model'

@Component({
  components: {
    Page,
    Wrapper
  }
})
export default class TextQuestion extends Vue {
  @Prop() private questionResponse!: QuestionResponseDto;
  @Prop() private questionConfig!: any;
  @Prop() private readOnly!: boolean;

  private fieldValue: string = ''

  get optionType() {
    return this.questionConfig?.is_single_select ? 'radio' : 'checkbox'
  }

  get possibleAnswers() {
    return this.questionConfig?.possible_answers || []
  }

  get fieldName() {
    return this.questionResponse.field_name
  }

  created() {
    this.fieldValue = this.questionResponse &&
      this.questionResponse.current_value
      ? this.questionResponse.current_value[0]
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
