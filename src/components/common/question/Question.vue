<template>
  <div>
    <div
      v-if="name"
      class="name"
    >
      Uppgift {{ name }}:
    </div>

    <div
      class="text"
      v-html="text"
    />

    <p
      class="text-hint"
      v-if="!!textHint"
    >
      {{ textHint }}
    </p>

    <component
      @change="onChange"
      :is="currentComponent()"
      :question-config="questionConfig"
      :question-response="questionResponse"
      :question-id="questionId"
      :read-only="readOnly"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit } from 'vue-property-decorator'
import { FormUpdate, QuestionResponseDto } from './model'
import Button from '@/components/common/Button.vue'
import Loader from '@/components/common/Loader.vue'
import OptionsQuestion from '@/components/common/question/OptionsQuestion.vue'
import TextQuestion from '@/components/common/question/TextQuestion.vue'
import ImagesQuestion from '@/components/common/question/ImagesQuestion.vue'
import NumberQuestion from '@/components/common/question/NumberQuestion.vue'

@Component({
  components: {
    Button,
    OptionsQuestion,
    TextQuestion,
    ImagesQuestion,
    NumberQuestion,
    Loader
  }
})
export default class Question extends Vue {
  @Prop() private questionResponse!: QuestionResponseDto;
  @Prop() private questionConfig!: any;
  @Prop() private questionType!: string;
  @Prop() private questionId!: string;
  @Prop() private readOnly!: boolean;

  currentComponent() {
    return this.questionType
  }

  @Emit('change')
  onChange(e: FormUpdate) {
    return e
  }

  get text() {
    return this.questionConfig?.text
  }

  get name() {
    return this.questionConfig?.name
  }

  get textHint() {
    return this.questionConfig?.text_hint
  }
}
</script>

<style scoped>
div.text >>> img {
  width: 100%;
}
p.text-hint {
  font-size: 90%;
  font-style: italic;
}
div.text >>> p {
  margin: 0 0 10px 0;
}
div.name {
  float: left;
  box-sizing: border-box;
  margin: 0px 0.5em 0px 0px;
  padding: 0px;
  font-weight: bold;
}
</style>
