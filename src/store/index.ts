import * as Analytics from '@/utils/Analytics'

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

type State = {
  deviceTest: Record<string, DeviceTestStatus>
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
  }
}

const store = {
  state,
  setDeviceTestStatus(testName: string, status: Status, message?: string) {
    console.log(`Set status for ${testName} to ${status} with message '${message}'.`)
    Analytics.logEvent(Analytics.AnalyticsEventType.DEVICE_TEST, 'set', 'status', {
      test: testName,
      status: Status[status]
    })
    this.state.deviceTest[testName].status = status
    this.state.deviceTest[testName].statusMessage = message
  }
}

export default store
