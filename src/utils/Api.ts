import * as AuthUtils from '@/utils/Auth'
import * as Analytics from '@/utils/Analytics'


export type Request = {
    endpoint: string
    method?: string
    payload?: any
    unauthenticated?: boolean
}


export type Response = {
    payload?: any
    status: number
}

export class ApiError extends Error {
    public status: number
    constructor(message: string, statusCode: number) {
        super(message)
        this.status = statusCode
    }
}
export class NotSignedInError extends Error {
}

const withTokenQueryParam = (endpoint: string) => {
    const token = AuthUtils.getTokenCookie()
    if (!token) {
        throw new NotSignedInError()
    }
    return `${endpoint}?token=${token}`
}

export const call = async (request: Request): Promise<Response> => {
    try {
        const authenticated = !request.unauthenticated
        const url = authenticated
            ? withTokenQueryParam(request.endpoint)
            : request.endpoint
        const resp = await fetch(
            url,
            {
                method: request.method ?? 'GET',
                ...(request.payload ? {
                    body: JSON.stringify(request.payload),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                } : {})
            }
        )
        if (resp.ok) {
            return {
                status: resp.status,
                payload: await resp.json()
            } as Response
        } else {
            throw new ApiError('Non-ok http response.', resp.status)
        }
    } catch (e) {
        throw e
    }

}