<template>
  <div>
    <h2>Logga in resten av laget</h2>
    <p>Skicka denna länk till dina lagkompisar:</p>
    <p class="auth-link">
      {{ authLink }}
    </p>
    <div class="buttons">
      <Button
        label="Kopiera"
        type="primary"
        @click="copyAuthLink"
      />
      <Button
        label="Visa QR-kod"
        type="primary"
        @click="openQrCodeScreen"
      />
    </div>
    <Message
      v-if="copySucceeded"
      header="Länk kopierad"
      message="Öppna en chattapp och klistra in den i ett meddelande."
      type="info"
    />
    <p>Om länken eller QR-koden inte fungerar så kan du be lagkompisarna surfa till denna adress och ange er PIN-kod:</p>
    <p class="auth-link">
      {{ baseLink }}
    </p>
    <p></p>
    <h3>PIN-kod:</h3>
    <div><code>{{ authCode }}</code></div>
    <Fullscreen
      v-if="showQrCode"
      @close="closeQrCodeScreen"
    >
      <div class="qr-code-container">
        <div class="qr-code">
          <QrcodeVue
            :value="authLink"
            size="200"
          />
          <p class="note auth-link">{{ authLink }}</p>
        </div>
        <div>
          <p>På din kompis mobil: Starta kameran. Rikta den mot QR-koden. Mobilen borde upptäcka QR-koden efter några sekunder.</p>
        </div>
      </div>
    </Fullscreen>
  </div>
</template>

<script lang="ts">
import copy from 'copy-to-clipboard';
import QrcodeVue from 'qrcode.vue'

import { Component, Vue, Prop } from 'vue-property-decorator'
import Fullscreen from '@/components/common/Fullscreen.vue'
import Button from '@/components/common/Button.vue'
import Message from '@/components/common/Message.vue'

@Component({
  components: {
    Button,
    QrcodeVue,
    Fullscreen,
    Message
  }
})
export default class Share extends Vue {
  @Prop({ default: '' }) private readonly authLink!: string
  @Prop({ default: '' }) private readonly baseLink!: string
  @Prop({ default: '' }) private readonly authCode!: string
  private copySucceeded: boolean = false
  private showQrCode: boolean = false

  copyAuthLink() {
    this.copySucceeded = copy(this.authLink)
  }

  openQrCodeScreen() {
    this.showQrCode = true
  }
  closeQrCodeScreen() {
    this.showQrCode = false
  }
}
</script>

<style scoped>
.auth-link {
  word-break: break-all;
}
.qr-code {
  width: 100%;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
}
.qr-code-container {
  width: 100%;
  display: flex;
  justify-content: space-evenly;
  height: 100%;
  flex-direction: column;
  box-sizing: border-box;
  padding: 20px;
}
.buttons {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}
.buttons button {
  margin-right: 10px;
}
</style>