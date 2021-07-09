const HIGH_ACCURACY_THRESHOLD = 150;

export const isAccuratePosition = (meterAccuracy: number) => meterAccuracy > 0 && meterAccuracy <= HIGH_ACCURACY_THRESHOLD
