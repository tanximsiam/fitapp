import type { Measurement } from '@/types/fitness'
import type { SourceRecords } from '@/types/ingest'

/**
 * The FitApp watch connection layer, in three replaceable parts:
 *
 *   WatchTransport  bytes to and from a watch (Bluetooth LE GATT on a phone)
 *   WatchBindings   how a watch is recognised, how the pairing handshake runs, and how its data is read and decoded
 *   source.ts       turns any transport + bindings pair into a HealthSource for the sync pipeline
 *
 * To run FitApp with your own wearable or platform, implement WatchBindings for your device's protocol
 * (and a transport if it is not Bluetooth LE) and register them in registry.ts. Screens, data model,
 * upload and insights stay the same.
 */

/** Byte-level link to one connected watch. Services and characteristics are UUID strings. */
export interface WatchLink {
  write(service: string, characteristic: string, data: Uint8Array, opts?: { withoutResponse?: boolean }): Promise<void>
  read(service: string, characteristic: string): Promise<Uint8Array>
  /** Calls onData for every notification until the returned function is called. */
  subscribe(service: string, characteristic: string, onData: (data: Uint8Array) => void): Promise<() => Promise<void>>
  disconnect(): Promise<void>
}

export interface ScanFilter {
  services?: string[]
  namePrefix?: string
}

export interface FoundWatch {
  id: string
  name: string | null
}

export interface WatchTransport {
  /** Whether the radio is usable (present, switched on, permitted). */
  ready(): Promise<{ ok: boolean; reason?: string }>
  scan(filter: ScanFilter, timeoutMs: number): Promise<FoundWatch[]>
  connect(watchId: string): Promise<WatchLink>
}

/** Whatever the handshake needs to remember between sessions (e.g. a shared auth key). Stored in secure storage. */
export type WatchSecret = string

export interface WatchIdentity {
  /** Model name to show, read from the watch. */
  device: string
  firmware?: string
}

export interface WatchBindings {
  /** Stable ingest source key, e.g. "fitapp-watch". */
  key: string
  name: string
  scanFilter: ScanFilter
  /** Measurements these bindings can read. */
  provides: Measurement[]
  /**
   * Pairs (secret null: first time, may ask the person to confirm on the watch) or re-authenticates
   * (secret from an earlier pairing). Throws if the watch refuses.
   */
  handshake(link: WatchLink, secret: WatchSecret | null): Promise<{ identity: WatchIdentity; secret: WatchSecret }>
  /** Reads and decodes records between `from` and `to`, limited to `only`. */
  read(link: WatchLink, from: Date, to: Date, only: Measurement[]): Promise<SourceRecords>
}
