// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { aesEcbBlock, createFitAppWatchBindings, decodeTime, encodeTime, fromHex, toHex } from '@/sources/watch/fitappWatch'
import { createWatchSource, type PairingStore } from '@/sources/watch/source'
import { fakeWatch } from './fakeWatch'

function memoryStore(): PairingStore & { value: unknown } {
  const s = { value: null as unknown, get: async () => s.value as never, set: async (p: unknown) => void (s.value = p), clear: async () => void (s.value = null) }
  return s
}

describe('FitApp watch protocol', () => {
  it('computes AES-128 of one block (FIPS-197 test vector)', async () => {
    const out = await aesEcbBlock(fromHex('000102030405060708090a0b0c0d0e0f'), fromHex('00112233445566778899aabbccddeeff'))
    expect(toHex(out)).toBe('69c4e0d86a7b0430d8cdb78070b4c55a')
  })

  it('encodes watch time as year LE16, month, day, hour, minute', () => {
    const d = new Date(2026, 9, 17, 6, 5)
    expect(encodeTime(d)).toEqual([0xea, 0x07, 10, 17, 6, 5])
    expect(decodeTime(Uint8Array.from(encodeTime(d)), 0)).toEqual(d)
  })

  it('pairs with a phone-generated key, then proves it on later connections', async () => {
    const watch = fakeWatch({ model: 'S1' })
    const store = memoryStore()
    const source = createWatchSource(createFitAppWatchBindings(), watch.transport, store)
    await source.connect()
    expect(watch.log).toEqual(['pair'])
    expect((store.value as { secret: string }).secret).toBe(watch.keyHex())
    expect(await source.device()).toBe('FitApp watch S1')

    // A later session authenticates with the stored key and does not pair again.
    await source.read(new Date(), new Date(), ['steps'])
    expect(watch.log.filter((l) => l === 'pair')).toHaveLength(1)
  })

  it('reports a pairing the person did not confirm, and stores nothing', async () => {
    const store = memoryStore()
    const source = createWatchSource(createFitAppWatchBindings({ pairTimeoutMs: 200 }), fakeWatch({ confirmPairing: false }).transport, store)
    await expect(source.connect()).rejects.toThrow(/did not accept pairing/)
    expect(store.value).toBeNull()
  })

  it('refuses a stale key with a clear message', async () => {
    const store = memoryStore()
    const watch = fakeWatch()
    const source = createWatchSource(createFitAppWatchBindings(), watch.transport, store)
    await source.connect()
    ;(store.value as { secret: string }).secret = '00'.repeat(16)
    await expect(source.read(new Date(), new Date(), ['steps'])).rejects.toThrow(/did not recognise this phone/)
  })

  it('downloads minute activity across several rounds into whole-day steps and heart-rate readings', async () => {
    const start = new Date(2026, 9, 16, 0, 0)
    // Two days of minutes: 1 step a minute; heart rate every 10th minute, otherwise "none" (255).
    const minutes = Array.from({ length: 2 * 1440 }, (_, i) => ({ steps: 1, bpm: i % 10 === 0 ? 60 + (i % 50) : 255 }))
    const watch = fakeWatch({ data: { start, minutes }, maxMinutesPerFetch: 1000 })
    const source = createWatchSource(createFitAppWatchBindings(), watch.transport, memoryStore())
    await source.connect()

    // Asked from mid-day: the read starts at local midnight so day totals are complete.
    const records = await source.read(new Date(2026, 9, 16, 15, 0), new Date(2026, 9, 18, 0, 0), ['steps', 'heart_rate'])
    expect(watch.log.filter((l) => l.startsWith('fetch'))).toEqual(['fetch 0+1000', 'fetch 1000+1000', 'fetch 2000+880'])
    expect(records.activity).toEqual([
      { date: '2026-10-16', steps: 1440 },
      { date: '2026-10-17', steps: 1440 },
    ])
    expect(records.heart_rate?.samples).toHaveLength(288)
    expect(records.heart_rate?.samples[0]).toEqual({ at: start.toISOString(), bpm: 60 })
  })

  it('reads only the assigned measurements', async () => {
    const start = new Date(2026, 9, 16, 0, 0)
    const watch = fakeWatch({ data: { start, minutes: [{ steps: 5, bpm: 70 }] } })
    const source = createWatchSource(createFitAppWatchBindings(), watch.transport, memoryStore())
    await source.connect()
    expect(await source.read(start, new Date(2026, 9, 17), ['heart_rate'])).toEqual({ heart_rate: { samples: [{ at: start.toISOString(), bpm: 70 }] } })
  })
})
