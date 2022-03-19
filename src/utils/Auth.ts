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

// Credits: https://stackoverflow.com/a/38552302
function parseJwt(token: string) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
};

export const getGroupKey = (): string | null => {
  const token = getTokenCookie()
  if (token) {
    const parsedToken = parseJwt(token)
    if (parsedToken.group_key) {
      return parsedToken.group_key;
    }
  }
  return null
}