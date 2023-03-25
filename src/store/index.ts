import { QuestionDto, ExtendedQuestionGroupDto } from '@/components/common/question/model'
import * as Analytics from '@/utils/Analytics'
import * as LocalSettings from '@/utils/LocalSettings'
import * as Api from '@/utils/Api'
import Vue from 'vue'

const VALUE_TRUE = 'true'
const VALUE_FALSE = 'false'

const LOCALSETTING_DEBUG_MAP = 'debug-map'
const LOCALSETTING_DEBUG_CONSOLE = 'debug-console'
const LOCALSETTING_FORM_AUTO_SAVE = 'form-auto-save'

const CALLER_KEY_PREFIX = 'post_answer__'

const getQuestionIdFromEventCallerKey = (callerKey: string): number => {
  return callerKey.startsWith(CALLER_KEY_PREFIX) ? parseInt(callerKey.substring(CALLER_KEY_PREFIX.length)) : 0
}

export const postAnwserCallerKey = (questionId: string) => CALLER_KEY_PREFIX + questionId

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
    showUnavailableStations: boolean
    highAccuracyThreshold: number
    highAccuracyTimeout: number
    stalePositionTimeout: number
  },
  uploads: {
    maxFileSize: number
  },
  updates: {
    configPollInterval: number
  },
  messages: {
    infoPageContent: string
    startPageContent: string
  },
  views: {
    answer: boolean
    map: boolean
    tickets: boolean
    duels: boolean
    deviceTest: boolean
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

export type Profile = {
  groupKey: null
  authCode: null
  groupName: null
  groupPortalLink: null
  groupAppLink: null
  baseAppLink: null
  categoryName: null
  countCompeting: number | null
  countFollower: number | null
  countTeamContact: number | null
}

type Answers = {
  questionGroups: ExtendedQuestionGroupDto[]
  lastFetchTimestamp: number
}

type State = {
  deviceTest: Record<string, DeviceTestStatus>
  configuration: Configuration
  eventLog: EventLog
  debugSettings: Debug
  autoSave: boolean
  profile: Profile
  answers: Answers
}

type EventLog = {
  events: Analytics.AppEvent[]
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
      showUnavailableStations: false,
      highAccuracyThreshold: 100,
      highAccuracyTimeout: 30,
      stalePositionTimeout: 120
    },
    uploads: {
      maxFileSize: 5
    },
    updates: {
      configPollInterval: 5
    },
    messages: {
      infoPageContent: 'Ingen information just nu.',
      startPageContent: 'Ingen information just nu.'
    },
    views: {
      answer: true,
      map: true,
      tickets: true,
      duels: true,
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
  },
  autoSave: LocalSettings.get(LOCALSETTING_FORM_AUTO_SAVE) === VALUE_TRUE,
  profile: {
    groupKey: null,
    authCode: null,
    groupName: null,
    groupPortalLink: null,
    groupAppLink: null,
    baseAppLink: null,
    categoryName: null,
    countCompeting: null,
    countFollower: null,
    countTeamContact: null
  },
  answers: {
    questionGroups: [],
    lastFetchTimestamp: 0
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
  setProfile(updatedProfile: Profile) {
    this.state.profile = updatedProfile
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
  },
  setFormAutoSave(value: boolean) {
    this.state.autoSave = value
    LocalSettings.set(LOCALSETTING_FORM_AUTO_SAVE, value ? VALUE_TRUE : VALUE_FALSE)
  },
  setQuestionGroupsCheckedNow() {
    this.state.answers.lastFetchTimestamp = Date.now()
  },
  updateQuestion(updatedQuestionData: QuestionDto) {
    for (const questionGroup of this.state.answers.questionGroups) {
      const index = questionGroup.questions.findIndex(q => q.id === updatedQuestionData.id)
      if (index !== -1) {
        questionGroup.questions.splice(index, 1, updatedQuestionData)
        return
      }
    }
  },
  setAnswerQuestionGroups(data: ExtendedQuestionGroupDto[]) {
    this.state.answers.questionGroups = data
  }
}

Api.addQueueListeners({
  onSuccess: (event) => {
    const postAnswerQuestionId = getQuestionIdFromEventCallerKey(event.callerKey || '')
    if (postAnswerQuestionId) {
      const updatedQuestionData = (event.response.payload as QuestionDto)
      store.updateQuestion({ ...updatedQuestionData, id: postAnswerQuestionId })
    }
  }
})

export default store
