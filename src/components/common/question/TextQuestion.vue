<template>
  <Wrapper
    :text="text"
    :hint="textHint"
  >
    <div class="input-wrapper">
      <input
        type="text"
        :value="fieldValue"
        :name="fieldName"
      >
    </div>
  </Wrapper>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import Page from '@/components/layout/Page.vue'
import Wrapper from './Wrapper.vue'

@Component({
  components: {
    Page,
    Wrapper
  }
})
export default class OptionsQuestion extends Vue {
  @Prop() private question: any;

  get text() {
    return this.question.config.text
  }

  get textHint() {
    return this.question.config.text_hint
  }

  get optionType() {
    return this.question.config.is_single_select ? 'radio' : 'checkbox'
  }

  get possibleAnswers() {
    return this.question.config.possible_answers || []
  }

  get fieldName() {
    return this.question.response.field_name
  }

  get fieldValue() {
    return this.question && this.question.response && this.question.response.current_value ? this.question.response.current_value[0] : ''
  }
}
</script>

<style scoped>
input {
  box-sizing: border-box;
  width: 100%;
  margin: 15px 0px 5px 0px;
  padding: 5px;
  border: 1px solid #bbb;

  font: 16px/1.4 'Open Sans', Tahoma, Verdana, Segoe, sans-serif;
}
</style>
