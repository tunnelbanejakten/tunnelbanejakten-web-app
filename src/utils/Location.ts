const HIGH_ACCURACY_THRESHOLD = parseInt(process.env.VUE_APP_HIGH_ACCURACY_THRESHOLD || '50', 10)

export enum AccuracyLevel {
    HIGHEST,
    HIGH,
    MEDIUM,
    LOW,
}

export const getAccuracyLevel = (meterAccuracy: number): AccuracyLevel => {
  return meterAccuracy <= HIGH_ACCURACY_THRESHOLD
    ? AccuracyLevel.HIGHEST
    : meterAccuracy <= 150
      ? AccuracyLevel.HIGH
      : meterAccuracy <= 250
        ? AccuracyLevel.MEDIUM
        : AccuracyLevel.LOW
}
