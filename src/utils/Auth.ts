import * as LocalSettings from './LocalSettings'

const SETTING_NAME = 'api-token'

export const setTokenCookie = (token: string) => {
  LocalSettings.set(SETTING_NAME, token)
}

export const unsetTokenCookie = () => {
  LocalSettings.unset(SETTING_NAME)
}

export const getTokenCookie = (): string | null => {
  return LocalSettings.get(SETTING_NAME)
}
