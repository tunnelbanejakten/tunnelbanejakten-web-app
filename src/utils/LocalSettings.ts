const PREFIX = 'tunnelbanejakten.'

export const set = (key: string, value: string) => {
  console.log('Set', key, JSON.stringify(value))
  document.cookie = `${PREFIX}${key}=${value};max-age=${7 * 24 * 60 * 60};samesite;secure`
}

export const unset = (key: string) => {
  document.cookie = `${PREFIX}${key}=;max-age=0;expires=0;samesite;secure`
}

export const get = (key: string): string | null => {
  const cookies: string[] = document.cookie.split('; ')
  const cookie = cookies.find((c: string) => c.startsWith(`${PREFIX}${key}=`))
  if (cookie) {
    const cookieValue = cookie.split('=')[1]
    return cookieValue || null
  } else {
    return null
  }
}
