const TOKEN_COOKIE_NAME = 'tunnelbanejakten-api.token'

export const setTokenCookie = (token: string) => {
    document.cookie = `${TOKEN_COOKIE_NAME}=${token};max-age=${7 * 24 * 60 * 60};samesite;secure`
}

export const unsetTokenCookie = () => {
    document.cookie = `${TOKEN_COOKIE_NAME}=;max-age=0;expires=0;samesite;secure`
}

export const getTokenCookie = (): string | null => {
    const cookies: string[] = document.cookie.split('; ')
    const cookie = cookies.find((c: string) => c.startsWith(TOKEN_COOKIE_NAME + '='))
    if (cookie) {
        const cookieValue = cookie.split('=')[1];
        return cookieValue || null
    } else {
        return null
    }
}