import type { Measurement } from '@/types/fitness'
import type { SourceRecords } from '@/types/ingest'

/**
 * Anything that can supply wearable measurements on this phone: the FitApp watch connection layer,
 * Android Health Connect or Apple Health. The sync pipeline (sync.ts) only talks to this interface,
 * so a new provider is one more adapter, not a change to the app.
 */
export type SourceId = 'fitapp-watch' | 'health-connect' | 'apple-health'

export interface Availability {
  available: boolean
  /** Shown to the person when not available. */
  reason?: string
}

export interface HealthSource {
  id: SourceId
  name: string
  /** Stable ingest key; the backend de-duplicates uploads by (key, date or instant). */
  key: string
  /** Measurements this adapter can read in this build. Anything else shows as not available. */
  provides: Measurement[]
  availability(): Promise<Availability>
  /** Asks for permission (or pairs). Returns the measurements actually granted. */
  connect(): Promise<Measurement[]>
  /** Forgets local pairing or state. System permissions are revoked in the system settings. */
  disconnect(): Promise<void>
  /** Device name to show, when the source can identify it reliably; otherwise null. */
  device(): Promise<string | null>
  /** Records between `from` and `to`, limited to `only` (the measurements assigned to this source). */
  read(from: Date, to: Date, only: Measurement[]): Promise<SourceRecords>
  /** Opens the system screen where permissions for this source are managed, if there is one. */
  openSettings?(): Promise<void>
}
