const HIGH_ACCURACY_THRESHOLD = parseInt(process.env.VUE_APP_HIGH_ACCURACY_THRESHOLD || '50', 10)

export const isAccuratePosition = (meterAccuracy: number) => meterAccuracy > 0 && meterAccuracy <= HIGH_ACCURACY_THRESHOLD
