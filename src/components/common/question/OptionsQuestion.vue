<template>
  <div>
    <div
      v-for="opt in possibleAnswers"
      class="option"
      :key="opt"
    >
      <label>
        <input
          v-if="isSingleSelect"
          type="radio"
          :readonly="readOnly"
          :disabled="readOnly"
          :value="opt"
          v-model="fieldValue"
        >
        <input
          v-if="!isSingleSelect"
          type="checkbox"
          :readonly="readOnly"
          :disabled="readOnly"
          :value="opt"
          v-model="fieldValues"
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
import { FormUpdate, QuestionDto } from './model'

@Component({
  components: {
    Page,
    Wrapper
  }
})
export default class OptionsQuestion extends Vue {
  @Prop() private question!: QuestionDto;
  @Prop() private readOnly!: boolean;

  private isSingleSelect: boolean = false
  private fieldValue: string = ''
  private fieldValues: string[] = []

  get possibleAnswers() {
    return this.question.config?.possible_answers || []
  }

  get fieldName() {
    return (
      this.question.response.field_name +
      (!this.isSingleSelect ? '[]' : '')
    )
  }

  created() {
    const inputValue = this.question &&
      this.question.response &&
      this.question.response.current_value
      ? this.question.response.current_value
      : []
    const singleSelect = this.question.config?.is_single_select
    if (singleSelect) {
      this.fieldValue = inputValue[0]
      this.$watch('fieldValue', this.onChangeRadio)
    } else {
      this.fieldValues = inputValue
      this.$watch('fieldValues', this.onChangeCheckbox)
    }
    this.isSingleSelect = singleSelect
  }

  createFormUpdateObject(values: string[]): FormUpdate {
    return {
      updatedFields: values.map((value: string) => ({
        key: this.fieldName,
        value
      }))
    } as FormUpdate
  }

  @Emit('change')
  onChangeRadio() {
    return this.createFormUpdateObject([this.fieldValue])
  }

  @Emit('change')
  onChangeCheckbox() {
    return this.createFormUpdateObject(this.fieldValues)
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
