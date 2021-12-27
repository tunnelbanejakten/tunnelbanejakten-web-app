<template>
  <Page title="Testa din mobil">
    <StepbystepProgress
      :current-index="currentIndex"
      :statuses="statuses"
    />
    <div class="test-component-wrapper">
      <Card :verticalMargin="false">
        <component :is="currentComponent()" />
        <Message
          v-if="isStatusMessageAvailable"
          :header="statusHeader"
          :message="statusMessage"
          :type="statusType"
        />
      </Card>
    </div>
    <div class="step-navigation">
      <div class="step-navigate-button">
        <Button
          v-if="isPreviousStepAvailable()"
          @click="previous"
          label="Bakåt"
          type="secondary"
        />
      </div>
      <div class="step-navigate-button">
        <Button
          v-if="isNextStepAvailable()"
          @click="next"
          label="Fortsätt"
        />
      </div>
    </div>
  </Page>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Page from '@/components/layout/Page.vue'
import Card from '@/components/layout/Card.vue'
import store, { Status } from '@/store'

import StepbystepProgress from '@/components/common/StepbystepProgress.vue'
import Button from '@/components/common/Button.vue'
import Message, { Type as MessageType } from '@/components/common/Message.vue'

import Intro from '@/views/device-test/Intro.vue'
import Camera from '@/views/device-test/Camera.vue'
import Location from '@/views/device-test/Location.vue'
// import Forms from '@/views/device-test/Forms.vue'
import Summary from '@/views/device-test/Summary.vue'
import Connectivity from '@/views/device-test/Connectivity.vue'
// import Discord from '@/views/device-test/Discord.vue'

type Step = {
  label: string
  component: string
  stateKey: string
}

@Component({
  components: {
    Page,
    Card,
    StepbystepProgress,
    Button,
    Intro,
    Connectivity,
    Camera,
    Location,
    // Forms,
    // Discord,
    Summary,
    Message
  }
})
export default class DeviceTest extends Vue {
  private currentIndex = 0
  private steps: Step[] = [
    {
      label: 'Intro',
      component: 'Intro',
      stateKey: 'intro'
    },
    {
      label: 'Connectivity',
      component: 'Connectivity',
      stateKey: 'connectivity'
    },
    {
      label: 'Camera',
      component: 'Camera',
      stateKey: 'camera'
    },
    {
      label: 'Location',
      component: 'Location',
      stateKey: 'location'
    },
    // {
    //   label: 'Forms',
    //   component: Forms,
    //   stateKey: 'forms'
    // },
    // {
    //   label: 'Discord',
    //   component: Discord,
    //   stateKey: 'discord'
    // },
    {
      label: 'Summary',
      component: 'Summary',
      stateKey: 'summary'
    }
  ]

  private state = store.state.deviceTest

  get statuses(): Status[] {
    return this.steps.map(({ stateKey }: Step) => Status.PENDING)
  }

  currentComponent() {
    return this.steps[this.currentIndex].component
  }

  get isStatusMessageAvailable() {
    switch (this.state[this.steps[this.currentIndex].stateKey]?.status) {
      case Status.SUCCESS:
      case Status.FAILURE:
        return true
      default:
        return false
    }
  }

  get statusType() {
    switch (this.state[this.steps[this.currentIndex].stateKey]?.status) {
      case Status.SUCCESS:
        return MessageType.SUCCESS
      case Status.FAILURE:
        return MessageType.FAILURE
      default:
        return MessageType.INFO
    }
  }

  get statusHeader() {
    switch (this.state[this.steps[this.currentIndex].stateKey]?.status) {
      case Status.SUCCESS:
        return 'Testet gick bra.'
      case Status.FAILURE:
        return 'Testet misslyckades.'
      default:
        return 'Lite oklar status just nu...'
    }
  }

  get statusMessage() {
    return this.state[this.steps[this.currentIndex].stateKey]?.statusMessage
  }

  stepCount() {
    return this.steps.length
  }

  next() {
    this.currentIndex++
  }

  previous() {
    this.currentIndex--
  }

  isPreviousStepAvailable() {
    return this.currentIndex > 0
  }

  isNextStepAvailable() {
    return this.currentIndex < this.stepCount() - 1
  }
}
</script>

<style scoped>
.step-navigation {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
.test-component-wrapper {
  text-align: center;
  margin: 10px 0 20px 0;
}
</style>
