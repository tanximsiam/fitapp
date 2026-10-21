import type { ISODate } from '@/types/fitness'
import type { SourceRecords } from '@/types/ingest'
import type { WatchBindings, WatchLink } from './bindings'

/**
 * FitApp watch bindings: pairing handshake and activity download over Bluetooth LE.
 *
 * Status: written from the protocol description, tested against a byte-level fake watch
 * (tests/unit/fitappWatch.spec.ts), NOT yet run against a physical watch. Expect to adjust UUIDs,
 * flags or framing when a device is available. Everything protocol-specific is in this file.
 *
 * Handshake (auth service, one characteristic, requests written without response, answers as notifications):
 *   pair      phone → [0x01, authFlags, key×16]          watch → [0x10, 0x01, 0x01]          (person confirms on the watch)
 *   challenge phone → [0x02 | crypt, authFlags, …]       watch → [0x10, 0x02, 0x01, random×16]
 *   proof     phone → [0x03 | crypt, authFlags, AES-128-ECB(random, key)]   watch → [0x10, 0x03, 0x01]
 *
 * Activity download (main service; control characteristic answers as notifications, data arrives on a second one):
 *   start     phone → [0x01, 0x01, year LE16, month, day, hour, minute]   watch → [0x10, 0x01, 0x01, count LE32, year LE16, month, day, hour, minute]
 *   send      phone → [0x02]    data → [counter, (kind, intensity, steps, bpm) × n] per notification, one sample per minute
 *   done      watch → [0x10, 0x02, 0x01] on the control characteristic
 */

const uuid = (short: number) => `0000${short.toString(16).padStart(4, '0')}-0000-1000-8000-00805f9b34fb`
const custom = (n: number) => `${n.toString(16).padStart(8, '0')}-0000-3512-2118-0009af100700`

export const UUIDS = {
  mainService: uuid(0xfee0),
  authService: uuid(0xfee1),
  auth: custom(0x09),
  fetchControl: custom(0x04),
  activityData: custom(0x05),
  deviceInfo: uuid(0x180a),
  modelNumber: uuid(0x2a24),
  firmware: uuid(0x2a26),
} as const

export interface FitAppWatchOptions {
  /** Second byte of every auth request; some firmware expects 0x08. */
  authFlags?: number
  /** 0x00: the watch accepts a key from the phone at pairing. 0x80: the watch has a pre-shared key, entered by the person. */
  cryptFlags?: number
  /** How long the person has to confirm pairing on the watch. */
  pairTimeoutMs?: number
  /** Device name prefix to look for while scanning, if any. */
  namePrefix?: string
}

const RESPONSE = 0x10
const OK = 0x01
const NO_HEART_RATE = new Set([0, 0xff])
/** One download is capped by the watch; keep asking until caught up, but never loop forever. */
const MAX_FETCH_ROUNDS = 20

export const toHex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
export const fromHex = (s: string) => Uint8Array.from(s.match(/../g) ?? [], (h) => parseInt(h, 16))

/** AES-128-ECB of one 16-byte block. WebCrypto has no ECB; for a single block it equals CBC with a zero IV (first 16 bytes). */
export async function aesEcbBlock(keyBytes: Uint8Array, block: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-CBC', false, ['encrypt'])
  const out = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-CBC', iv: new Uint8Array(16) }, key, block))
  return out.slice(0, 16)
}

/** Watch-local wall time as [year LE16, month, day, hour, minute]. */
export function encodeTime(d: Date): number[] {
  return [d.getFullYear() & 0xff, d.getFullYear() >> 8, d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()]
}
export function decodeTime(b: Uint8Array, at: number): Date {
  return new Date(b[at] | (b[at + 1] << 8), b[at + 2] - 1, b[at + 3], b[at + 4], b[at + 5])
}

/** Writes a request and waits for the first notification `accept` recognises. */
async function exchange(link: WatchLink, service: string, characteristic: string, request: number[], accept: (b: Uint8Array) => boolean, timeoutMs: number, withoutResponse = false): Promise<Uint8Array> {
  let resolve!: (b: Uint8Array) => void
  const answer = new Promise<Uint8Array>((r) => (resolve = r))
  const stop = await link.subscribe(service, characteristic, (b) => accept(b) && resolve(b))
  try {
    await link.write(service, characteristic, Uint8Array.from(request), { withoutResponse })
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('The watch did not answer in time.')), timeoutMs))
    return await Promise.race([answer, timeout])
  } finally {
    await stop()
  }
}

const pad = (n: number) => String(n).padStart(2, '0')
const localDate = (d: Date): ISODate => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

export interface MinuteSample {
  at: Date
  steps: number
  bpm: number | null
}

/** Activity notifications (first byte a counter, then 4 bytes per minute) to samples from `start`. */
export function decodeActivity(packets: Uint8Array[], start: Date): MinuteSample[] {
  const out: MinuteSample[] = []
  for (const p of packets)
    for (let i = 1; i + 3 < p.length; i += 4) {
      const bpm = p[i + 3]
      out.push({ at: new Date(start.getTime() + out.length * 60_000), steps: p[i + 2], bpm: NO_HEART_RATE.has(bpm) || bpm < 20 ? null : bpm })
    }
  return out
}

/** Minute samples to ingest records: whole-day step totals and the heart-rate readings. */
export function minutesToRecords(samples: MinuteSample[], only: string[]): SourceRecords {
  const out: SourceRecords = {}
  if (only.includes('steps')) {
    const days = new Map<ISODate, number>()
    for (const s of samples) days.set(localDate(s.at), (days.get(localDate(s.at)) ?? 0) + s.steps)
    const activity = [...days].filter(([, steps]) => steps > 0).map(([date, steps]) => ({ date, steps }))
    if (activity.length) out.activity = activity
  }
  if (only.includes('heart_rate')) {
    const hr = samples.filter((s) => s.bpm != null).map((s) => ({ at: s.at.toISOString(), bpm: s.bpm! }))
    if (hr.length) out.heart_rate = { samples: hr.slice(-10_000) }
  }
  return out
}

export function createFitAppWatchBindings(opts: FitAppWatchOptions = {}): WatchBindings {
  const authFlags = opts.authFlags ?? 0x00
  const crypt = opts.cryptFlags ?? 0x00
  const auth = (l: WatchLink, request: number[], cmd: number, timeoutMs = 10_000) =>
    exchange(l, UUIDS.authService, UUIDS.auth, request, (b) => b[0] === RESPONSE && (b[1] & 0x0f) === cmd, timeoutMs, true)

  async function readText(l: WatchLink, characteristic: string) {
    try {
      return new TextDecoder().decode(await l.read(UUIDS.deviceInfo, characteristic)).replace(/\0+$/, '').trim() || undefined
    } catch {
      return undefined
    }
  }

  return {
    key: 'fitapp-watch',
    name: 'FitApp watch',
    scanFilter: { services: [UUIDS.mainService], namePrefix: opts.namePrefix },
    provides: ['steps', 'heart_rate'],

    async handshake(l, secret) {
      let key = secret ? fromHex(secret) : null
      if (!key) {
        if (crypt !== 0x00) throw new Error('This watch needs its pairing key entered on the phone.')
        key = crypto.getRandomValues(new Uint8Array(16))
        const r = await auth(l, [0x01, authFlags, ...key], 0x01, opts.pairTimeoutMs ?? 30_000)
        if (r[2] !== OK) throw new Error('The watch did not accept pairing. Confirm on the watch when it asks.')
      }
      const challenge = await auth(l, crypt === 0x00 ? [0x02, authFlags] : [crypt | 0x02, authFlags, 0x02, 0x01, 0x00], 0x02)
      if (challenge[2] !== OK || challenge.length < 19) throw new Error('The watch refused the connection.')
      const proof = await aesEcbBlock(key, challenge.slice(3, 19))
      const done = await auth(l, [crypt | 0x03, authFlags, ...proof], 0x03)
      if (done[2] !== OK) throw new Error('The watch did not recognise this phone. Pair it again.')

      const model = await readText(l, UUIDS.modelNumber)
      const firmware = await readText(l, UUIDS.firmware)
      return { identity: { device: model ? `FitApp watch ${model}` : 'FitApp watch', firmware }, secret: toHex(key) }
    },

    async read(l, from, to, only) {
      // Day totals replace what the server has for that date, so always start at a local midnight.
      let since = startOfDay(from)
      const samples: MinuteSample[] = []
      for (let round = 0; round < MAX_FETCH_ROUNDS && since < to; round++) {
        const packets: Uint8Array[] = []
        const stopData = await l.subscribe(UUIDS.mainService, UUIDS.activityData, (b) => packets.push(b))
        try {
          const start = await exchange(l, UUIDS.mainService, UUIDS.fetchControl, [0x01, 0x01, ...encodeTime(since)], (b) => b[0] === RESPONSE && b[1] === 0x01, 10_000)
          const count = start[3] | (start[4] << 8) | (start[5] << 16) | (start[6] << 24)
          if (start[2] !== OK || count === 0) break
          const firstMinute = decodeTime(start, 7)
          await exchange(l, UUIDS.mainService, UUIDS.fetchControl, [0x02], (b) => b[0] === RESPONSE && b[1] === 0x02, 60_000)
          const got = decodeActivity(packets, firstMinute).filter((s) => s.at < to)
          if (!got.length) break
          samples.push(...got)
          since = new Date(got[got.length - 1].at.getTime() + 60_000)
        } finally {
          await stopData()
        }
      }
      return minutesToRecords(samples, only)
    },
  }
}
