import * as AuthUtils from '@/utils/Auth'
import * as Analytics from '@/utils/Analytics'
import mitt from 'mitt'

type Events = {
    start: QueuedRequestEvent
    succeeded: QueuedRequestSucceededEvent
    failed: QueuedRequestFailedEvent
}

export type QueuedRequestEvent = {
    key: string
}

export type QueuedRequestSucceededEvent = QueuedRequestEvent & {
    response: Response
}

export type QueuedRequestFailedEvent = QueuedRequestEvent & {
    error: Error
}

export type QueueListeners = {
    onStart?: (event: QueuedRequestEvent) => void
    onSuccess?: (event: QueuedRequestSucceededEvent) => void
    onFailure?: (event: QueuedRequestFailedEvent) => void
}

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

const emitter = mitt<Events>()

let timer = 0

const DEBOUNCE_TIMEOUT = 2000

const queuedRequests = new Map<string, Request>()

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

export const queue = (request: Request): string => {
    const key = `${request.method}__${request.endpoint}`

    queuedRequests.set(key, request)

    if (timer) {
        clearTimeout(timer)
    }
    timer = setTimeout(processQueue, DEBOUNCE_TIMEOUT);

    return key
}

export const addQueueListeners = (listeners: QueueListeners) => {
    if (listeners.onStart) {
        emitter.on('start', listeners.onStart)
    }
    if (listeners.onFailure) {
        emitter.on('failed', listeners.onFailure)
    }
    if (listeners.onSuccess) {
        emitter.on('succeeded', listeners.onSuccess)
    }
}

export const removeQueueListeners = (listeners: QueueListeners) => {
    if (listeners.onStart) {
        emitter.off('start', listeners.onStart)
    }
    if (listeners.onFailure) {
        emitter.off('failed', listeners.onFailure)
    }
    if (listeners.onSuccess) {
        emitter.off('succeeded', listeners.onSuccess)
    }
}

const processQueue = async () => {
    const entries = queuedRequests.entries()
    for (const [key, request] of entries) {
        emitter.emit('start', { key } as QueuedRequestEvent)
        try {
            const response = await call(request)
            emitter.emit('succeeded', {
                key,
                response
            } as QueuedRequestSucceededEvent)
        } catch (e: any) {
            emitter.emit('failed', {
                key,
                error: e
            } as QueuedRequestFailedEvent)
        }
        queuedRequests.delete(key)
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