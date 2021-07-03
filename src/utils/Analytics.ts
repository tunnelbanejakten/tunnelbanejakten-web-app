import amplitude from 'amplitude-js'

const APIKEY = process.env.VUE_APP_AMPLITUDE_APIKEY
const APP_VERSION = process.env.VUE_APP_VERSION

export enum AnalyticsEventType {
  APP,
  DEVICE_TEST,
  LOCATION
}

let isAnalyticsInitialized = false

const initAmplitude = () => {
  amplitude.getInstance().init(APIKEY)
  isAnalyticsInitialized = true
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
  amplitude.getInstance().identify(identify);
}

export const logEvent = (type: AnalyticsEventType, eventVerb: string, eventObject: string, props?: Record<string, any>) => {
  const actionName = eventVerb.toLowerCase() + ' ' + eventObject.toLowerCase()
  const eventName = AnalyticsEventType[type].toLowerCase() + ': ' + actionName
  const patchedProps = {
    ...props,
    appVersion: APP_VERSION,
    actionCategory: AnalyticsEventType[type].toLowerCase(),
    actionName: actionName
  }
  if (APIKEY) {
    if (!isAnalyticsInitialized) {
      initAmplitude()
    }
    amplitude.getInstance().logEvent(eventName, patchedProps)
  }
  console.log(eventName, patchedProps)
}
