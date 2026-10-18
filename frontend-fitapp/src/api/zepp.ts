import { api } from './client'

export interface ZeppConnectionStatus {
  status: 'connected' | 'revoked' | 'error'
  zeppUserId: string
  connectedAt: string | null
  lastEventAt: string | null
  lastSyncAt: string | null
  lastError: string | null
}

export interface ZeppStatus {
  /** The server has Zepp credentials in its .env. */
  configured: boolean
  requiredEnv: string[]
  redirectUri: string
  webhookUrl: string
  connection: ZeppConnectionStatus | null
}

type Payload = {
  configured: boolean
  required_env: string[]
  redirect_uri: string
  webhook_url: string
  connection: null | {
    status: ZeppConnectionStatus['status']
    zepp_user_id: string
    connected_at: string | null
    last_event_at: string | null
    last_sync_at: string | null
    last_error: string | null
  }
}

export async function getZeppStatus(): Promise<ZeppStatus> {
  const d = (await api.get<{ data: Payload }>('/zepp/status')).data.data
  const c = d.connection
  return {
    configured: d.configured,
    requiredEnv: d.required_env,
    redirectUri: d.redirect_uri,
    webhookUrl: d.webhook_url,
    connection: c && {
      status: c.status,
      zeppUserId: c.zepp_user_id,
      connectedAt: c.connected_at,
      lastEventAt: c.last_event_at,
      lastSyncAt: c.last_sync_at,
      lastError: c.last_error,
    },
  }
}

/** URL of Zepp's consent page; the browser navigates there and returns via the backend callback. */
export async function startZeppConnect(): Promise<string> {
  return (await api.post<{ data: { url: string } }>('/zepp/authorize')).data.data.url
}

export async function disconnectZepp(): Promise<void> {
  await api.delete('/zepp/connection')
}

export async function requestZeppBackfill(days: number): Promise<void> {
  await api.post('/zepp/backfill', { days })
}
