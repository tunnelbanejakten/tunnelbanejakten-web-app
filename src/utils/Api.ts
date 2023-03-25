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
    callerKey?: string
}

export type QueuedRequestSucceededEvent = QueuedRequestEvent & {
    response: ApiResponse
}

export type QueuedRequestFailedEvent = QueuedRequestEvent & {
    error: Error
}

export type QueueListeners = {
    onStart?: (event: QueuedRequestEvent) => void
    onSuccess?: (event: QueuedRequestSucceededEvent) => void
    onFailure?: (event: QueuedRequestFailedEvent) => void
}

export type ApiRequest = {
    endpoint: string
    method?: string
    payload?: any
    unauthenticated?: boolean
    callerKey?: string
}


export type ApiResponse = {
    payload?: any
    status: number
}

export class ApiError extends Error {
    public status: number
    public payload?: any
    constructor(message: string, statusCode: number, payload?: any) {
        super(message)
        this.status = statusCode
        this.payload = payload
    }
}

export class NotSignedInError extends Error {
    constructor() {
        super("User not signed in")
    }
}

const emitter = mitt<Events>()

let timer = 0

let clientServerMsClockSkew = 0 // Positive number means that the device's click is this number of milliseconds _ahead_ of the server's clock.

const DEBOUNCE_TIMEOUT = 2000

const queuedRequests = new Map<string, ApiRequest>()

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

export const queue = (request: ApiRequest): string => {
    const key = `${request.method}__${request.endpoint}`

    queuedRequests.set(key, request)

    clearTimer()

    timer = setTimeout(processQueue, DEBOUNCE_TIMEOUT);

    return key
}

const clearTimer = () => {
    if (timer) {
        clearTimeout(timer)
        timer = 0
    }
}

export const dequeue = (key: string): void => {
    queuedRequests.delete(key)

    if (queuedRequests.size === 0) {
        clearTimer()
    }
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

export const processQueue = async () => {
    clearTimer()
    const entries = queuedRequests.entries()
    for (const [key, request] of entries) {
        const baseEvent = {
            key,
            callerKey: request.callerKey
        } as QueuedRequestEvent

        emitter.emit('start', baseEvent)
        try {
            const response = await call(request)
            emitter.emit('succeeded', { ...baseEvent, response } as QueuedRequestSucceededEvent)
        } catch (e: any) {
            emitter.emit('failed', { ...baseEvent, error: e } as QueuedRequestFailedEvent)
        }
        queuedRequests.delete(key)
    }
}

const readPayloadText = async (response: Response): Promise<string> => {
    try {
        return response.text()
    } catch (e: any) {
        return ''
    }
}

// Translates a server timestamp, expressed in UTC milliseconds, into the corresponding timestamp according to 
// the user device's clock. It tries to take the clock skew and latency between client and server into account.
export const serverMsTimeToDeviceTime = (serverTimestamp: number) => serverTimestamp + clientServerMsClockSkew

const updateClockSkew = (clientStartTime: number, clientEndTime: number, resp: Response) => {
    const serverStartTime = parseInt(resp.headers.get('Tuja-Timing-Request-Start') || '0', 10)
    const serverEndTime = parseInt(resp.headers.get('Tuja-Timing-Request-End') || '0', 10)
    if (serverStartTime && serverEndTime) {
        const clientMidTime = clientStartTime + ((clientEndTime - clientStartTime) / 2)
        const serverMidTime = serverStartTime + ((serverEndTime - serverStartTime) / 2)
        clientServerMsClockSkew = clientMidTime - serverMidTime
    }
}

export const call = async (request: ApiRequest): Promise<ApiResponse> => {
    try {
        const authenticated = !request.unauthenticated
        const url = authenticated
            ? withTokenQueryParam(request.endpoint)
            : request.endpoint
        const { body, contentType } = getBodyProps(request.payload)
        const headers = new Headers()
        const fetchConfig: RequestInit = {
            method: request.method ?? 'GET',
            mode: 'cors',
            headers
        }
        if (body) {
            fetchConfig.body = body
        }
        if (contentType) {
            headers.set('Content-Type', contentType)
        }
        const clientStartTime = Date.now()
        const resp = await fetch(
            url,
            fetchConfig
        )
        const clientEndTime = Date.now()
        updateClockSkew(clientStartTime, clientEndTime, resp)
        if (resp.ok) {
            const payloadText = await readPayloadText(resp)
            const payload = !!payloadText ? JSON.parse(payloadText) : null
            return {
                status: resp.status,
                payload
            } as ApiResponse
        } else {
            const payloadText = await readPayloadText(resp)
            const payload = !!payloadText ? JSON.parse(payloadText) : null
            throw new ApiError(`Serverfel ${resp.status}.`, resp.status, payload)
        }
    } catch (e) {
        throw e
    }
}