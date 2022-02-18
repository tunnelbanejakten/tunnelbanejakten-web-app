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

const getBodyProps = (body: any): { body?: any, contentType: string } => {
    if (body instanceof FormData) {
        return {
            body,
            contentType: ''
        }
    } else if (!!body) {
        return {
            body: JSON.stringify(body),
            contentType: 'application/json'
        }
    } else {
        return {
            contentType: ''
        }
    }
}

export const call = async (request: Request): Promise<Response> => {
    try {
        const authenticated = !request.unauthenticated
        const url = authenticated
            ? withTokenQueryParam(request.endpoint)
            : request.endpoint
        const { body, contentType } = getBodyProps(request.payload)
        const headers = new Headers()
        const fetchConfig: RequestInit = {
            method: request.method ?? 'GET',
            headers
        }
        if (body) {
            fetchConfig.body = body
        }
        if (contentType) {
            headers.set('Content-Type', contentType)
        }
        const resp = await fetch(
            url,
            fetchConfig
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