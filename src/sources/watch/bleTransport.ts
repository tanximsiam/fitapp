import { Capacitor } from '@capacitor/core'
import { BleClient } from '@capacitor-community/bluetooth-le'
import type { FoundWatch, ScanFilter, WatchLink, WatchTransport } from './bindings'

/** Bluetooth LE GATT transport for the watch connection layer (@capacitor-community/bluetooth-le). */

const view = (b: Uint8Array) => new DataView(b.buffer, b.byteOffset, b.byteLength)
const bytes = (v: DataView) => new Uint8Array(v.buffer, v.byteOffset, v.byteLength).slice()

let initialized: Promise<void> | null = null
// Android 12+: scanning is declared as not used for location (see AndroidManifest.xml).
const init = () => (initialized ??= BleClient.initialize({ androidNeverForLocation: true }))

export const bleTransport: WatchTransport = {
  async ready() {
    if (!Capacitor.isNativePlatform()) return { ok: false, reason: 'Bluetooth pairing works in the Android and iOS app, not in a browser.' }
    try {
      await init()
      return (await BleClient.isEnabled()) ? { ok: true } : { ok: false, reason: 'Bluetooth is off. Turn it on to pair the watch.' }
    } catch {
      initialized = null
      return { ok: false, reason: 'Bluetooth permission was not granted.' }
    }
  },

  async scan(filter: ScanFilter, timeoutMs: number): Promise<FoundWatch[]> {
    await init()
    const found = new Map<string, FoundWatch>()
    await BleClient.requestLEScan({ services: filter.services, namePrefix: filter.namePrefix }, (r) => {
      found.set(r.device.deviceId, { id: r.device.deviceId, name: r.localName ?? r.device.name ?? null })
    })
    await new Promise((resolve) => setTimeout(resolve, timeoutMs))
    await BleClient.stopLEScan()
    return [...found.values()]
  },

  async connect(watchId: string): Promise<WatchLink> {
    await init()
    await BleClient.connect(watchId, undefined, { timeout: 15_000 })
    const subscriptions: [string, string][] = []
    return {
      write: (service, characteristic, data, opts) =>
        opts?.withoutResponse
          ? BleClient.writeWithoutResponse(watchId, service, characteristic, view(data))
          : BleClient.write(watchId, service, characteristic, view(data)),
      read: async (service, characteristic) => bytes(await BleClient.read(watchId, service, characteristic)),
      async subscribe(service, characteristic, onData) {
        await BleClient.startNotifications(watchId, service, characteristic, (v) => onData(bytes(v)))
        subscriptions.push([service, characteristic])
        return () => BleClient.stopNotifications(watchId, service, characteristic)
      },
      async disconnect() {
        for (const [s, c] of subscriptions) await BleClient.stopNotifications(watchId, s, c).catch(() => {})
        await BleClient.disconnect(watchId)
      },
    }
  },
}
