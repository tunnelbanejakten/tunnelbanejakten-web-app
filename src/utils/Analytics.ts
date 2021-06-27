import amplitude from "amplitude-js";

const APIKEY = process.env.VUE_APP_AMPLITUDE_APIKEY;

export enum AnalyticsEventType {
  APP_MOUNTED,
  SET_DEVICE_TEST_STATUS
}

let isAnalyticsInitialized: boolean = false

const initAmplitude = () => {
  amplitude.getInstance().init(APIKEY);
  isAnalyticsInitialized = true
}

export default (type: AnalyticsEventType, props?: Record<string, any>) => {
  if (APIKEY) {
    if (!isAnalyticsInitialized) {
      initAmplitude()
    }
    amplitude.getInstance().logEvent(AnalyticsEventType[type], props);
  }
  console.log(AnalyticsEventType[type], props)
}
