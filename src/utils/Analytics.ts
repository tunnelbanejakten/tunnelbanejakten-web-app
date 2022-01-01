import amplitude from 'amplitude-js'
import store from '@/store'
import * as Auth from './Auth'
const APIKEY = process.env.VUE_APP_AMPLITUDE_APIKEY
const APP_VERSION = process.env.VUE_APP_VERSION

export enum AnalyticsEventType {
  APP,
  DEVICE_TEST,
  LOCATION,
  MAP,
  FORM,
  CAMERA
}

export enum LogLevel {
  DEBUG,
  INFO,
  WARNING,
  ERROR
}

export type AppEvent = {
  level: LogLevel,
  timestamp: number,
  type: AnalyticsEventType,
  eventVerb: string,
  eventObject: string,
  props?: Record<string, any>
}

let isAnalyticsInitialized = false

let lastTokenCookieValue: string | null = null

const initAmplitude = () => {
  amplitude.getInstance().init(APIKEY)
  isAnalyticsInitialized = true
}

// Credits: https://stackoverflow.com/a/38552302
function parseJwt(token: string) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
};

const updateUserId = () => {
  const token = Auth.getTokenCookie()
  if (token !== lastTokenCookieValue) {
    if (token) {
      const parsedToken = parseJwt(token)
      if (parsedToken.group_key) {
        amplitude.getInstance().setUserId(parsedToken.group_key);
      }
    } else {
      amplitude.getInstance().setUserId(null);
    }
    lastTokenCookieValue = token
  }
}

export type UserProperties = {
  group_key?: string
  group_name?: string
  user_key?: string
  competition_key?: string
}

export const setUserProperties = (props: UserProperties) => {
  const identify = new amplitude.Identify()
    .set('competitionKey', props.competition_key || '')
    .set('groupKey', props.group_key || '')
    .set('groupName', props.group_name || '')
    .set('userKey', props.user_key || '')
  amplitude.getInstance().identify(identify)
}

const logToAmplitude = ({ type, eventObject, eventVerb, props, level }: AppEvent) => {
  if (level !== LogLevel.DEBUG && APIKEY) {
    const actionName = eventVerb.toLowerCase() + ' ' + eventObject.toLowerCase()
    const eventName = AnalyticsEventType[type].toLowerCase() + ': ' + actionName
    const patchedProps = {
      ...props,
      appVersion: APP_VERSION,
      actionCategory: AnalyticsEventType[type].toLowerCase(),
      actionName: actionName
    }
    if (!isAnalyticsInitialized) {
      initAmplitude()
    }
    updateUserId()
    amplitude.getInstance().logEvent(eventName, patchedProps)
  }
}

const logToConsole = (event: AppEvent) => {
  console.log({
    ...event,
    type: AnalyticsEventType[event.type].toLowerCase()
  })
  store.addEvent(event)
}

export const logEvent = (type: AnalyticsEventType, eventVerb: string, eventObject: string, props?: Record<string, any>, level: LogLevel = LogLevel.INFO) => {
  const appEvent = {
    level,
    timestamp: Date.now(),
    type,
    eventVerb,
    eventObject,
    props
  }
  logToConsole(appEvent)
  logToAmplitude(appEvent)
}
