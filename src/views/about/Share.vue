<template>
  <div>
    <h2>Logga in resten av laget</h2>
    <p>Skicka denna länk till dina lagkompisar:</p>
    <div class="auth-link-field">
      <input
        type="text"
        readonly
        :value="authLink"
      >
      <Button
        label="Kopiera"
        type="secondary"
        @click="copyAuthLink"
      ></Button>
    </div>
    <Message
      v-if="copySucceeded"
      header="Länk kopierad"
      message="Öppna en chattapp och klistra in den i ett meddelande."
      type="info"
    />
    <p>Ert lags PIN-kod: <code>{{ authCode }}</code></p>
    <p class="note">PIN-koden behövs ibland vid inloggning.</p>
  </div>
</template>

<script lang="ts">
import copy from 'copy-to-clipboard';

import { Component, Vue, Prop } from 'vue-property-decorator'
import Button from '@/components/common/Button.vue'
import Message from '@/components/common/Message.vue'

@Component({
  components: {
    Button,
    Message
  }
})
export default class Share extends Vue {
  @Prop({ default: '' }) private readonly authLink!: string
  @Prop({ default: '' }) private readonly authCode!: string
  private copySucceeded: boolean = false

  copyAuthLink() {
    this.copySucceeded = copy(this.authLink)
  }
}
</script>

<style scoped>
p.note {
  font-size: 90%;
  font-style: italic;
  margin: 10px 0 0 0;
}
.auth-link-field {
  display: flex;
  align-items: center;
}
.auth-link-field button {
  margin-left: 10px;
}
.auth-link-field input {
  flex: 1;
  background-color: #eee;

  box-sizing: border-box;
  width: 100%;
  margin: 5px 0px 5px 0px;
  padding: 10px;
  border: 1px solid #bbb;
  border-radius: 5px;

  font: 16px/1.4 "Open Sans", Tahoma, Verdana, Segoe, sans-serif;
}
</style>