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

export default (type: AnalyticsEventType, eventVerb: string, eventObject: string, props?: Record<string, any>) => {
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
