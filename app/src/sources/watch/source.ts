import { SecureStorage } from '@aparajita/capacitor-secure-storage'
import type { HealthSource } from '../types'
import type { WatchBindings, WatchIdentity, WatchSecret, WatchTransport } from './bindings'

/** What is remembered about the paired watch. The secret never leaves secure storage. */
interface Pairing {
  watchId: string
  secret: WatchSecret
  identity: WatchIdentity
}

const STORE_KEY = 'fitapp.watch.pairing'

export interface PairingStore {
  get(): Promise<Pairing | null>
  set(p: Pairing): Promise<void>
  clear(): Promise<void>
}

export const securePairingStore: PairingStore = {
  async get() {
    try {
      return JSON.parse((await SecureStorage.getItem(STORE_KEY)) ?? 'null')
    } catch {
      return null
    }
  },
  set: (p) => SecureStorage.setItem(STORE_KEY, JSON.stringify(p)),
  clear: () => SecureStorage.removeItem(STORE_KEY),
}

/** Any transport + bindings pair as a HealthSource. Without either, the watch shows as not available, never as connected. */
export function createWatchSource(bindings: WatchBindings | null, transport: WatchTransport | null, store: PairingStore = securePairingStore): HealthSource {
  async function session<T>(run: (link: Awaited<ReturnType<WatchTransport['connect']>>, pairing: Pairing) => Promise<T>): Promise<T> {
    const pairing = await store.get()
    if (!bindings || !transport || !pairing) throw new Error('The FitApp watch is not paired.')
    const link = await transport.connect(pairing.watchId)
    try {
      const { identity, secret } = await bindings.handshake(link, pairing.secret)
      if (secret !== pairing.secret || identity.device !== pairing.identity.device) await store.set({ ...pairing, secret, identity })
      return await run(link, pairing)
    } finally {
      await link.disconnect().catch(() => {})
    }
  }

  return {
    id: 'fitapp-watch',
    name: bindings?.name ?? 'FitApp watch',
    key: bindings?.key ?? 'fitapp-watch',
    provides: bindings?.provides ?? [],

    async availability() {
      if (!bindings) return { available: false, reason: 'This build does not include the watch connection bindings yet.' }
      if (!transport) return { available: false, reason: 'Bluetooth is not available in this build.' }
      const radio = await transport.ready()
      return radio.ok ? { available: true } : { available: false, reason: radio.reason ?? 'Bluetooth is off or not permitted.' }
    },

    async connect() {
      if (!bindings || !transport) throw new Error('The FitApp watch connection is not available.')
      const [found] = await transport.scan(bindings.scanFilter, 10_000)
      if (!found) throw new Error('No FitApp watch found nearby. Keep it close and awake, then try again.')
      const link = await transport.connect(found.id)
      try {
        const { identity, secret } = await bindings.handshake(link, null)
        await store.set({ watchId: found.id, secret, identity })
      } finally {
        await link.disconnect().catch(() => {})
      }
      return bindings.provides
    },

    disconnect: () => store.clear(),
    device: async () => (await store.get())?.identity.device ?? null,
    read: (from, to, only) => session((link) => bindings!.read(link, from, to, only)),
  }
}
