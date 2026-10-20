import type { WatchLink, WatchTransport } from '@/sources/watch/bindings'
import { aesEcbBlock, decodeTime, encodeTime, UUIDS } from '@/sources/watch/fitappWatch'

/**
 * A byte-level fake FitApp watch for tests: it speaks the pairing and activity protocol as described in
 * src/sources/watch/fitappWatch.ts. It proves the bindings are consistent with that description, not that
 * a physical watch behaves the same way.
 */
export function fakeWatch(opts: { confirmPairing?: boolean; data?: { start: Date; minutes: { steps: number; bpm: number }[] }; maxMinutesPerFetch?: number; model?: string } = {}) {
  let key: Uint8Array | null = null
  let random: Uint8Array | null = null
  let authed = false
  let pendingFetch: { from: number; count: number } | null = null
  const subs = new Map<string, Set<(b: Uint8Array) => void>>()
  const log: string[] = []
  const notify = (char: string, bytes: number[]) => setTimeout(() => subs.get(char)?.forEach((f) => f(Uint8Array.from(bytes))), 0)
  const minutes = opts.data?.minutes ?? []
  const dataStart = opts.data?.start ?? new Date()

  const link: WatchLink = {
    async write(_service, char, data, w) {
      const b = Array.from(data)
      if (char === UUIDS.auth) {
        if (!w?.withoutResponse) throw new Error('auth writes must be without response')
        const cmd = b[0] & 0x0f
        if (cmd === 0x01) {
          log.push('pair')
          if (opts.confirmPairing === false) return notify(char, [0x10, 0x01, 0x04])
          key = Uint8Array.from(b.slice(2, 18))
          return notify(char, [0x10, 0x01, 0x01])
        }
        if (cmd === 0x02) {
          random = crypto.getRandomValues(new Uint8Array(16))
          return notify(char, key ? [0x10, b[0], 0x01, ...random] : [0x10, b[0], 0x04])
        }
        if (cmd === 0x03) {
          const expected = key && random ? await aesEcbBlock(key, random) : null
          authed = !!expected && expected.every((x, i) => x === b[2 + i])
          return notify(char, [0x10, b[0], authed ? 0x01 : 0x04])
        }
      }
      if (char === UUIDS.fetchControl) {
        if (!authed) throw new Error('not authenticated')
        if (b[0] === 0x01) {
          const since = decodeTime(Uint8Array.from(b), 2)
          const from = Math.max(0, Math.round((since.getTime() - dataStart.getTime()) / 60_000))
          const count = Math.max(0, Math.min(minutes.length - from, opts.maxMinutesPerFetch ?? Infinity))
          pendingFetch = { from, count }
          log.push(`fetch ${from}+${count}`)
          const first = new Date(dataStart.getTime() + from * 60_000)
          return notify(char, [0x10, 0x01, count ? 0x01 : 0x04, count & 0xff, (count >> 8) & 0xff, (count >> 16) & 0xff, count >>> 24, ...encodeTime(first)])
        }
        if (b[0] === 0x02 && pendingFetch) {
          const { from, count } = pendingFetch
          for (let i = 0, n = 0; i < count; i += 4, n++) {
            const chunk = minutes.slice(from + i, from + Math.min(i + 4, count)).flatMap((m) => [1, 20, m.steps, m.bpm])
            notify(UUIDS.activityData, [n & 0xff, ...chunk])
          }
          setTimeout(() => notify(char, [0x10, 0x02, 0x01]), 0)
          return
        }
      }
    },
    async read(_service, char) {
      if (char === UUIDS.modelNumber) return new TextEncoder().encode(opts.model ?? 'S1\0')
      throw new Error('not readable')
    },
    async subscribe(_service, char, onData) {
      const set = subs.get(char) ?? subs.set(char, new Set()).get(char)!
      set.add(onData)
      return async () => void set.delete(onData)
    },
    disconnect: async () => void (authed = false),
  }

  const transport: WatchTransport = {
    ready: async () => ({ ok: true }),
    scan: async (filter) => (filter.services?.includes(UUIDS.mainService) ? [{ id: 'AA:BB', name: 'FitApp' }] : []),
    connect: async () => link,
  }
  return { transport, log, keyHex: () => (key ? Array.from(key, (x) => x.toString(16).padStart(2, '0')).join('') : null) }
}
