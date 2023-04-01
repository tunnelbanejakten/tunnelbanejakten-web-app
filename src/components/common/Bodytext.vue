<template>
  <div
    class="bodytext"
    v-html="html"
  ></div>
</template>
<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({
  components: {
  }
})
export default class QuestionGroupForm extends Vue {
  @Prop() private readonly html!: String
}
</script>

<style scoped>
.bodytext >>> img {
  width: 100%;
  height: 100%;
}
.bodytext >>> p {
  margin: 0;
  padding: 0 0 20px 0;
}
</style>