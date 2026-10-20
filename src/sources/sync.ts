import { reactive } from 'vue'
import { Capacitor } from '@capacitor/core'
import { SecureStorage } from '@aparajita/capacitor-secure-storage'
import { errorMessage, isNetworkError, isUnauthorized } from '@/api/client'
import { createIngestToken } from '@/api/fitness'
import { uploadIngest } from '@/api/ingest'
import type { Measurement } from '@/types/fitness'
import type { IngestPayload } from '@/types/ingest'
import { assignMeasurements } from './normalize'
import { SOURCES, sourceById } from './registry'
import type { SourceId } from './types'

/**
 * Phone sources → FitApp backend. Each connected source reads what it is assigned, the records go to
 * POST /api/ingest with this phone's ingest token, and the backend's idempotent keys make re-sending safe.
 * Only for a signed-in account: demo mode has its own simulated watch and never uploads.
 */

interface SourceState {
  granted: Measurement[]
  lastSyncAt: string | null
  error: string | null
}

/** First upload covers this much history; later ones re-send the last day too, since daily totals grow. */
const FIRST_SYNC_DAYS = 30
const OVERLAP_MS = 86_400_000

export const sources = reactive({
  account: null as number | null,
  state: {} as Partial<Record<SourceId, SourceState>>,
  syncing: false,
})

const stateKey = (account: number) => `fitapp.sources.u${account}`
const tokenKey = (account: number) => `fitapp.ingestToken.u${account}`

/** Loads which sources this account connected on this phone (not sensitive: names and timestamps only). */
export function useAccount(account: number | null) {
  if (sources.account === account) return
  sources.account = account
  try {
    sources.state = account == null ? {} : JSON.parse(localStorage.getItem(stateKey(account)) ?? '{}')
  } catch {
    sources.state = {}
  }
}

function persist() {
  if (sources.account != null) localStorage.setItem(stateKey(sources.account), JSON.stringify(sources.state))
}

async function ingestToken(account: number, renew = false): Promise<string> {
  const saved = renew ? null : await SecureStorage.getItem(tokenKey(account))
  if (saved) return saved
  const token = await createIngestToken(`FitApp mobile (${Capacitor.getPlatform()})`)
  await SecureStorage.setItem(tokenKey(account), token)
  return token
}

export async function connectSource(id: SourceId) {
  const source = sourceById(id)!
  const granted = await source.connect()
  if (!granted.length) throw new Error('No permission was granted, so there is nothing to read.')
  sources.state[id] = { granted, lastSyncAt: null, error: null }
  persist()
  await syncAll()
}

export async function disconnectSource(id: SourceId) {
  await sourceById(id)?.disconnect()
  delete sources.state[id]
  persist()
}

/** Reads and uploads every connected source. Errors are kept per source; one failing never blocks another. */
export async function syncAll(now = new Date()) {
  const account = sources.account
  if (account == null || sources.syncing) return
  const connected = SOURCES.filter((s) => sources.state[s.id])
  if (!connected.length) return
  sources.syncing = true
  try {
    const assigned = assignMeasurements(connected.map((s) => ({ id: s.id, granted: sources.state[s.id]!.granted })))
    for (const source of connected) {
      const st = sources.state[source.id]!
      const only = assigned[source.id]
      if (!only.length) continue
      try {
        const from = st.lastSyncAt ? new Date(Date.parse(st.lastSyncAt) - OVERLAP_MS) : new Date(now.getTime() - FIRST_SYNC_DAYS * OVERLAP_MS)
        const records = await source.read(from, now, only)
        const payload: IngestPayload = {
          source: { key: source.key, name: source.name, device: await source.device(), measurements: only },
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          ...records,
        }
        try {
          await uploadIngest(await ingestToken(account), payload)
        } catch (err) {
          // The token was revoked on the server (Settings → Ingest tokens): issue a new one once.
          if (!isUnauthorized(err)) throw err
          await uploadIngest(await ingestToken(account, true), payload)
        }
        st.lastSyncAt = now.toISOString()
        st.error = null
      } catch (err) {
        st.error = isNetworkError(err) ? 'Offline. Will sync when the connection is back.' : errorMessage(err, err instanceof Error ? err.message : 'Sync failed.')
      }
    }
  } finally {
    sources.syncing = false
    persist()
  }
}

/** Sign-out: forget this account's connections and its ingest token on this phone. */
export async function forgetAccount(account: number) {
  localStorage.removeItem(stateKey(account))
  await SecureStorage.removeItem(tokenKey(account))
  if (sources.account === account) sources.state = {}
}
