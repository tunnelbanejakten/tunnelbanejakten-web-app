import store from '@/store'

export enum AccuracyLevel {
  HIGHEST,
  HIGH,
  MEDIUM,
  LOW,
}

export const getAccuracyLevel = (meterAccuracy: number): AccuracyLevel => {
  const highAccuracyThreshold = store.state.configuration.positioning.highAccuracyThreshold || parseInt(process.env.VUE_APP_HIGH_ACCURACY_THRESHOLD || '50', 10)
  const accuracyLevel = meterAccuracy <= highAccuracyThreshold
    ? AccuracyLevel.HIGHEST
    : meterAccuracy <= highAccuracyThreshold * 1.5
      ? AccuracyLevel.HIGH
      : meterAccuracy <= highAccuracyThreshold * 3
        ? AccuracyLevel.MEDIUM
        : AccuracyLevel.LOW
  console.log(`Accuracy level for ${meterAccuracy} when <${highAccuracyThreshold} m is high accuracy: ${AccuracyLevel[accuracyLevel]}`)
  return accuracyLevel
}
