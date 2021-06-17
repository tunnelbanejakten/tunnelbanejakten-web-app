<template>
  <Page title="DeviceTest">
    <StepbystepProgress
      :current-index="currentIndex"
      :statuses="statuses"
    />
    <component
      :is="currentComponent()"
    />
    <div class="step-navigation">
      <div class="step-navigate-button">
        <Button
          v-if="isPreviousStepAvailable()"
          @click="previous"
          label="Tillbaka"
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
    <template v-slot:footer>
      Footer
    </template>
  </Page>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Page from '@/components/layout/Page.vue'
import store, { Status } from '@/store'

import StepbystepProgress from '@/components/common/StepbystepProgress.vue'
import Button from '@/components/common/Button.vue'

import Intro from '@/views/device-test/Intro.vue'
import Camera from '@/views/device-test/Camera.vue'
import Location from '@/views/device-test/Location.vue'
import Forms from '@/views/device-test/Forms.vue'
import Summary from '@/views/device-test/Summary.vue'
import Connectivity from '@/views/device-test/Connectivity.vue'
import Discord from '@/views/device-test/Discord.vue'

type Step = {
  label: string
  component: any
  stateKey: string
}

@Component({
  components: {
    Page,
    StepbystepProgress,
    Button,
    Intro,
    Connectivity,
    Camera,
    Location,
    Forms,
    Summary
  }
})
export default class DeviceTest extends Vue {
  private currentIndex = 0
  private steps: Step[] = [
    {
      label: 'Intro',
      component: Intro,
      stateKey: 'intro'
    },
    {
      label: 'Connectivity',
      component: Connectivity,
      stateKey: 'connectivity'
    },
    {
      label: 'Camera',
      component: Camera,
      stateKey: 'camera'
    },
    {
      label: 'Location',
      component: Location,
      stateKey: 'location'
    },
    {
      label: 'Forms',
      component: Forms,
      stateKey: 'forms'
    },
    {
      label: 'Discord',
      component: Discord,
      stateKey: 'discord'
    },
    {
      label: 'Summary',
      component: Summary,
      stateKey: 'summary'
    }
  ]

  private state = store.state.deviceTest

  get statuses (): Status[] {
    return this.steps.map(({ stateKey }: Step) => this.state[stateKey]?.status)
  }

  currentComponent () {
    return this.steps[this.currentIndex].component
  }

  stepCount () {
    return this.steps.length
  }

  next () {
    this.currentIndex++
  }

  previous () {
    this.currentIndex--
  }

  isPreviousStepAvailable () {
    return this.currentIndex > 0
  }

  isNextStepAvailable () {
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
</style>
