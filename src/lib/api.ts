import axios from 'axios'
import { env } from './env'

type JsonLike = Record<string, any> | any[] | string | number | boolean | null

export type ApiErrorCode = 'UNAUTH' | 'FORBIDDEN' | 'HTTP' | 'NETWORK'

export class ApiError extends Error {
  code: ApiErrorCode
  status?: number
  data?: JsonLike

  constructor(code: ApiErrorCode, message: string, status?: number, data?: JsonLike) {
    super(message)
    this.code = code
    this.status = status
    this.data = data
  }
}

function normalizeApiBase(raw: string | undefined) {
  return (raw || '').trim().replace(/\/+$/, '')
}

export function resolveV1BaseUrl() {
  //Vite proxy to keep cookies same-site.
  if (import.meta.env.DEV) return '/v1'
  const base = normalizeApiBase(env.apiBaseUrl)
  if (!base) return '/v1'
  return /\/v1$/i.test(base) ? base : `${base}/v1`
}

export function buildV1Url(path: string) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${resolveV1BaseUrl()}${cleanPath}`
}

export function getAuthLoginUrl() {
  return buildV1Url('/auth/login/google')
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const encodedName = encodeURIComponent(name)
  const parts = document.cookie ? document.cookie.split('; ') : []
  for (const part of parts) {
    const [k, ...rest] = part.split('=')
    if (k === encodedName) return decodeURIComponent(rest.join('='))
  }
  return null
}

function isV1Request(path: string) {
  if (path.startsWith('/v1')) return true
  try {
    const url = new URL(path, window.location.origin)
    return url.pathname.startsWith('/v1')
  } catch {
    return false
  }
}

const activeApiFetchControllers = new Set<AbortController>()

function buildCombinedSignal(signalA?: AbortSignal | null, signalB?: AbortSignal | null) {
  if (!signalA) return signalB || undefined
  if (!signalB) return signalA || undefined
  if (signalA.aborted) return signalA
  if (signalB.aborted) return signalB

  const bridge = new AbortController()
  const onAbort = () => bridge.abort()
  signalA.addEventListener('abort', onAbort, { once: true })
  signalB.addEventListener('abort', onAbort, { once: true })
  return bridge.signal
}

export function abortPendingApiFetchRequests() {
  for (const controller of activeApiFetchControllers) {
    controller.abort()
  }
  activeApiFetchControllers.clear()
}

export async function apiFetch<T = any>(path: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const headers = new Headers(options.headers || {})
  const isV1 = isV1Request(path)
  const controller = new AbortController()
  activeApiFetchControllers.add(controller)

  if (isV1) {
    const credentials = options.credentials || 'include'
    options = { ...options, credentials }
  }

  const isMutating = !['GET', 'HEAD', 'OPTIONS'].includes(method)
  if (isV1 && isMutating) {
    const csrf = getCookie('csrf_token')
    if (csrf && !headers.has('x-csrf-token')) {
      headers.set('x-csrf-token', csrf)
    }
  }

  let res: Response
  try {
    res = await fetch(path, {
      ...options,
      method,
      headers,
      signal: buildCombinedSignal(options.signal, controller.signal),
    })
  } catch (err: any) {
    activeApiFetchControllers.delete(controller)
    if (err?.name === 'AbortError') throw err
    throw new ApiError('NETWORK', err?.message || 'Network error')
  }
  activeApiFetchControllers.delete(controller)

  const raw = await res.text()
  let data: JsonLike = null
  if (raw) {
    try {
      data = JSON.parse(raw)
    } catch {
      data = raw
    }
  }

  if (res.status === 401) throw new ApiError('UNAUTH', 'Unauthorized', 401, data)
  if (res.status === 403) throw new ApiError('FORBIDDEN', 'Forbidden', 403, data)
  if (!res.ok) throw new ApiError('HTTP', `HTTP ${res.status}`, res.status, data)

  return data as T
}

export const api = axios.create({
  baseURL: resolveV1BaseUrl(),
  timeout: 15000,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  // Admin endpoints require x-admin-key
  if (config.url?.startsWith('/admin')) {
    config.headers = config.headers || {}
    ;(config.headers as any)['x-admin-key'] = env.adminApiKey
  }
  return config
})

export type Client = { id: string; name: string; createdAt: string; updatedAt?: string }
export type Landing = {
  id: string
  clientId: string
  name: string
  telegramConnectToken: string
  telegramConnectUrl?: string | null
  formEndpoint?: string | null
  primaryFormId?: string | null
  primaryForm?: Form | null
  createdAt: string
  updatedAt: string
  client?: Client
  destination?: any
  forms?: Form[]
}
export type Form = { id: string; landingId: string; name: string; fields: any[]; isActive: boolean; createdAt: string; updatedAt: string }
export type Submission = {
  id: string
  landingId: string
  formId: string
  createdAt: string
  name?: string | null
  email?: string | null
  phone?: string | null
  message?: string | null
  data: any
  deliveredAt?: string | null
  form?: Form | null
  deliveryLogs?: any[]
}
export type AuditEvent = {
  id: string
  eventType?: string | null
  event_type?: string | null
  entityTable?: string | null
  entity_table?: string | null
  entityId?: string | null
  entity_id?: string | null
  clientId?: string | null
  client_id?: string | null
  landingId?: string | null
  landing_id?: string | null
  createdAt?: string | null
  created_at?: string | null
  metadata?: Record<string, unknown> | null
  client?: { id?: string | null; name?: string | null } | null
  landing?: { id?: string | null; name?: string | null } | null
}

type AuditRequestOptions = {
  userId?: string
  useUserIdFallback?: boolean
  signal?: AbortSignal
}

type ListAuditEventsParams = AuditRequestOptions & {
  take?: number
  cursor?: string
  types?: string[]
  clientId?: string
  landingId?: string
  unreadOnly?: boolean
}

function getAuditRequestHeaders(options: AuditRequestOptions) {
  const headers: Record<string, string> = {}
  if (options.useUserIdFallback && options.userId) {
    headers['x-user-id'] = options.userId
  }
  return headers
}

export async function health() {
  const { data } = await api.get('/health')
  return data
}

export async function createClient(name: string) {
  const { data } = await api.post('/admin/clients', { name })
  return data.client as Client
}

export async function listClients(params: { q?: string; take?: number; cursor?: string }) {
  const qs = new URLSearchParams()
  qs.set('take', String(params.take ?? 50))
  if (params.q) qs.set('q', params.q)
  if (params.cursor) qs.set('cursor', params.cursor)

  const base = api.defaults.baseURL || ''
  const path = /\/v1\/?$/.test(base) ? '/admin/clients' : '/v1/admin/clients'
  const { data } = await api.get(`${path}?${qs.toString()}`, {
    headers: {
      'x-admin-key': env.adminApiKey,
    },
  })
  return data as { ok: true; clients: Client[]; nextCursor: string | null }
}

export async function createLanding(clientId: string, name: string) {
  const { data } = await api.post('/admin/landings', { clientId, name })
  return data as { ok: boolean; landing: Landing; form: Form; telegramConnectUrl: string; formEndpoint: string }
}

export async function listLandings(params: { clientId: string; q?: string; take?: number; cursor?: string }) {
  const qs = new URLSearchParams()
  qs.set('clientId', params.clientId)
  qs.set('take', String(params.take ?? 50))
  if (params.q) qs.set('q', params.q)
  if (params.cursor) qs.set('cursor', params.cursor)

  const base = api.defaults.baseURL || ''
  const path = /\/v1\/?$/.test(base) ? '/admin/landings' : '/v1/admin/landings'
  const { data } = await api.get(`${path}?${qs.toString()}`, {
    headers: {
      'x-admin-key': env.adminApiKey,
    },
  })
  return data as { ok: true; landings: Array<{ id: string; name: string; clientId: string; createdAt: string }>; nextCursor: string | null }
}

export async function getLanding(landingId: string) {
  const { data } = await api.get(`/admin/landings/${landingId}`)
  return data.landing as Landing
}

export async function getLandingDetails(landingId: string) {
  const { data } = await api.get(`/admin/landings/${landingId}`)
  return data as any
}

export async function createForm(landingId: string, payload: { name: string; fields: any[] }) {
  const { data } = await api.post(`/admin/landings/${landingId}/forms`, payload)
  return data.form as Form
}

export async function updateForm(landingId: string, formId: string, payload: any) {
  const { data } = await api.post(`/admin/landings/${landingId}/forms/${formId}`, payload)
  return data.form as Form
}

export async function makePrimaryForm(landingId: string, formId: string) {
  const { data } = await api.post(`/admin/landings/${landingId}/forms/${formId}/make-primary`)
  return data as { ok: boolean; landing?: Landing }
}

export async function listSubmissions(params: { landingId?: string; take?: number }) {
  const qs = new URLSearchParams()
  if (params.landingId) qs.set('landingId', params.landingId)
  if (params.take) qs.set('take', String(params.take))
  const { data } = await api.get(`/admin/submissions?${qs.toString()}`)
  return data.submissions as Submission[]
}

export async function submitForm(landingId: string, formId: string, body: any) {
  const { data } = await api.post(`/forms/${landingId}/${formId}/submit`, body)
  return data as any
}

export async function listAuditEvents(params: ListAuditEventsParams = {}) {
  const qs = new URLSearchParams()
  qs.set('take', String(params.take ?? 50))
  if (params.cursor) qs.set('cursor', params.cursor)
  if (params.types?.length) qs.set('types', params.types.join(','))
  if (params.clientId) qs.set('clientId', params.clientId)
  if (params.landingId) qs.set('landingId', params.landingId)
  if (params.unreadOnly) qs.set('unreadOnly', 'true')

  const { data } = await api.get(`/admin/events?${qs.toString()}`, {
    headers: getAuditRequestHeaders(params),
    signal: params.signal,
  })

  return {
    ok: Boolean(data?.ok ?? true),
    events: (data?.events ?? []) as AuditEvent[],
    nextCursor: (data?.nextCursor ?? data?.cursor ?? null) as string | null,
  }
}

export async function markAuditEventsAsRead(eventIds: string[], options: AuditRequestOptions = {}) {
  if (!eventIds.length) {
    return { ok: true, count: 0 }
  }

  const { data } = await api.post(
    '/admin/events/read',
    { eventIds },
    {
      headers: getAuditRequestHeaders(options),
      signal: options.signal,
    },
  )

  return {
    ok: Boolean(data?.ok ?? true),
    count: Number(data?.count ?? data?.updated ?? eventIds.length),
  }
}

export async function getAuditUnreadCount(options: AuditRequestOptions = {}) {
  try {
    const { data } = await api.get('/admin/events/unread-count', {
      headers: getAuditRequestHeaders(options),
      signal: options.signal,
    })

    const rawCount = data?.count ?? data?.unreadCount ?? data?.unread_count ?? 0
    const count = Number(rawCount)
    return Number.isFinite(count) ? count : 0
  } catch {
    const fallback = await listAuditEvents({
      take: 20,
      unreadOnly: true,
      userId: options.userId,
      useUserIdFallback: options.useUserIdFallback,
      signal: options.signal,
    })
    return fallback.events.length
  }
}
