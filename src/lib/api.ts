import axios from 'axios'
import { env } from './env'

export const api = axios.create({
  baseURL: env.apiBaseUrl.replace(/\/+$/, ''),
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  // Admin endpoints require x-admin-key
  if (config.url?.startsWith('/admin')) {
    config.headers = config.headers || {}
    ;(config.headers as any)['x-admin-key'] = env.adminApiKey
  }
  return config
})

export type Client = { id: string; name: string; createdAt: string; updatedAt: string }
export type Landing = {
  id: string
  clientId: string
  name: string
  telegramConnectToken: string
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

export async function health() {
  const { data } = await api.get('/health')
  return data
}

export async function createClient(name: string) {
  const { data } = await api.post('/admin/clients', { name })
  return data.client as Client
}

export async function createLanding(clientId: string, name: string) {
  const { data } = await api.post('/admin/landings', { clientId, name })
  return data as { ok: boolean; landing: Landing; form: Form; telegramConnectUrl: string; formEndpoint: string }
}

export async function getLanding(landingId: string) {
  const { data } = await api.get(`/admin/landings/${landingId}`)
  return data.landing as Landing
}

export async function createForm(landingId: string, payload: { name: string; fields: any[] }) {
  const { data } = await api.post(`/admin/landings/${landingId}/forms`, payload)
  return data.form as Form
}

export async function updateForm(landingId: string, formId: string, payload: any) {
  const { data } = await api.post(`/admin/landings/${landingId}/forms/${formId}`, payload)
  return data.form as Form
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
