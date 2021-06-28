import logEvent, { AnalyticsEventType } from '@/utils/Analytics'

export enum Status {
  PENDING,
  FAILURE,
  SUCCESS,
  USER_INTERACTION_REQUIRED
}

type DeviceTestStatus = {
  status: Status
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
  setDeviceTestStatus(testName: string, status: Status) {
    console.log(`Set status for ${testName} to ${status}. `)
    logEvent(AnalyticsEventType.DEVICE_TEST, 'set', 'status', {
      test: testName,
      status: Status[status]
    })
    this.state.deviceTest[testName].status = status
  }
}

export default store
