import * as Analytics from '@/utils/Analytics'
import * as LocalSettings from '@/utils/LocalSettings'
import Vue from 'vue'

const VALUE_TRUE = 'true'
const VALUE_FALSE = 'false'

const LOCALSETTING_DEBUG_MAP = 'debug-map'
const LOCALSETTING_DEBUG_CONSOLE = 'debug-console'

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

export enum QuestionGrouping {
  NONE,
  BY_QUESTION_GROUP,
  BY_QUESTION,
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
    tickets: boolean,
    deviceTest: boolean,
    info: boolean
  },
  answer: {
    questionGrouping: QuestionGrouping
  }
}

type Debug = {
  map: boolean
  console: boolean
}

type State = {
  deviceTest: Record<string, DeviceTestStatus>
  configuration: Configuration
  eventLog: EventLog
  debugSettings: Debug
}

type EventLog = {
  events: Analytics.AppEvent[],
  cursorPosition: number
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
      tickets: true,
      deviceTest: true,
      info: true
    },
    answer: {
      questionGrouping: QuestionGrouping.NONE
    }
  },
  // The event log is a fixed-length array of the most recent log entries. The cursorPosition property
  // species where in the array the most-recent log entry has been stored. Older entries are, eventually,
  // overwritten when currentPosition "wraps around" to index 0.
  eventLog: {
    events: Array(10).fill(null),
    cursorPosition: -1
  },
  debugSettings: {
    map: LocalSettings.get(LOCALSETTING_DEBUG_MAP) === VALUE_TRUE,
    console: LocalSettings.get(LOCALSETTING_DEBUG_CONSOLE) === VALUE_TRUE
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
  },
  // Insert event and move cursor to the next position.
  addEvent(event: Analytics.AppEvent) {
    this.state.eventLog.cursorPosition = (this.state.eventLog.cursorPosition + 1) % this.state.eventLog.events.length
    this.state.eventLog.events[this.state.eventLog.cursorPosition] = event
  },
  // Retrieve events in correct order.
  getEvents(): Analytics.AppEvent[] {
    const { events, cursorPosition } = this.state.eventLog;
    const res = [];
    for (let i = 0; i < events.length; i++) {
      const eventLogIndex =
        (cursorPosition + 1 + events.length + i) % events.length;
      const event = events[eventLogIndex];
      if (event) {
        res.push(event);
      }
    }
    return res;
  },
  setDebugMap(value: boolean) {
    this.state.debugSettings.map = value
    LocalSettings.set(LOCALSETTING_DEBUG_MAP, value ? VALUE_TRUE : VALUE_FALSE)
  },
  setDebugConsole(value: boolean) {
    this.state.debugSettings.console = value
    LocalSettings.set(LOCALSETTING_DEBUG_CONSOLE, value ? VALUE_TRUE : VALUE_FALSE)
  }
}

export default store
