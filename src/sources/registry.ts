import { createHealthPlatformSource } from './healthPlatform'
import type { HealthSource } from './types'
import type { WatchBindings, WatchTransport } from './watch/bindings'
import { createWatchSource } from './watch/source'

/**
 * Plug in the FitApp watch here: the bindings for its pairing handshake and data protocol, and the
 * transport that carries the bytes (see watch/bindings.ts). This build ships neither, so the watch
 * shows as "not available" and nothing pretends to be connected.
 */
export const WATCH_BINDINGS: WatchBindings | null = null
export const WATCH_TRANSPORT: WatchTransport | null = null

/** Priority order: a measurement comes from the first connected source that provides it. */
export const SOURCES: HealthSource[] = [createWatchSource(WATCH_BINDINGS, WATCH_TRANSPORT), createHealthPlatformSource()]

export const sourceById = (id: string) => SOURCES.find((s) => s.id === id) ?? null
