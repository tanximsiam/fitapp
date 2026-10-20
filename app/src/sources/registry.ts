import { createHealthPlatformSource } from './healthPlatform'
import type { HealthSource } from './types'
import type { WatchBindings, WatchTransport } from './watch/bindings'
import { bleTransport } from './watch/bleTransport'
import { createFitAppWatchBindings } from './watch/fitappWatch'
import { createWatchSource } from './watch/source'

/**
 * The FitApp watch: the bindings for its pairing handshake and data protocol, and the transport that
 * carries the bytes (see watch/bindings.ts). To run FitApp with another wearable, replace these two.
 */
export const WATCH_BINDINGS: WatchBindings | null = createFitAppWatchBindings()
export const WATCH_TRANSPORT: WatchTransport | null = bleTransport

/** Priority order: a measurement comes from the first connected source that provides it. */
export const SOURCES: HealthSource[] = [createWatchSource(WATCH_BINDINGS, WATCH_TRANSPORT), createHealthPlatformSource()]

export const sourceById = (id: string) => SOURCES.find((s) => s.id === id) ?? null
