import * as Analytics from '@/utils/Analytics'
import Vue from 'vue'

export enum Status {
  PENDING,
  FAILURE,
  SUCCESS,
  USER_INTERACTION_REQUIRED
}

type DeviceTestStatus = {
  status: Status
  statusMessage?: string
}

export type Configuration = {
  positioning: {
    highAccuracyThreshold: number,
    highAccuracyTimeout: number
  },
  uploads: {
    maxFileSize: number
  },
  updates: {
    configPollInterval: number
  },
  messages: {
    infoPageContent: string
  },
  views: {
    answer: boolean,
    map: boolean,
    deviceTest: boolean,
    info: boolean
  }
}

type State = {
  deviceTest: Record<string, DeviceTestStatus>
  configuration: Configuration
}

const state: State = {
  deviceTest: {
    // intro: { status: Status.PENDING },
    connectivity: { status: Status.PENDING },
    camera: { status: Status.PENDING },
    location: { status: Status.PENDING }
    // forms: { status: Status.PENDING },
    // discord: { status: Status.PENDING },
    // summary: { status: Status.PENDING }
  },
  configuration: {
    positioning: {
      highAccuracyThreshold: 100,
      highAccuracyTimeout: 30
    },
    uploads: {
      maxFileSize: 5
    },
    updates: {
      configPollInterval: 5
    },
    messages: {
      infoPageContent: 'Ingen information just nu.'
    },
    views: {
      answer: true,
      map: true,
      deviceTest: true,
      info: true
    }
  }
}

const store = {
  state: Vue.observable(state),
  setDeviceTestStatus(testName: string, status: Status, message?: string) {
    console.log(`Set status for ${testName} to ${status} with message '${message}'.`)
    Analytics.logEvent(Analytics.AnalyticsEventType.DEVICE_TEST, 'set', 'status', {
      test: testName,
      status: Status[status]
    })
    this.state.deviceTest[testName].status = status
    this.state.deviceTest[testName].statusMessage = message
  },
  setConfiguration(updatedConf: Configuration) {
    this.state.configuration = updatedConf
  }
}

export default store
