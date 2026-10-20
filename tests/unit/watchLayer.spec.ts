import { describe, expect, it } from 'vitest'
import { createWatchSource, type PairingStore } from '@/sources/watch/source'
import { simulatedWatch } from '@/sources/watch/simulated'

function memoryStore(): PairingStore & { value: unknown } {
  const s = {
    value: null as unknown,
    get: async () => s.value as never,
    set: async (p: unknown) => void (s.value = p),
    clear: async () => void (s.value = null),
  }
  return s
}

describe('FitApp watch connection layer', () => {
  it('is not available, and never connected, without bindings or transport', async () => {
    const source = createWatchSource(null, null, memoryStore())
    expect(await source.availability()).toEqual({ available: false, reason: expect.stringMatching(/bindings/) })
    expect(source.provides).toEqual([])
    await expect(source.read(new Date(), new Date(), ['steps'])).rejects.toThrow(/not paired/)
  })

  it('pairs once, keeps the secret, re-authenticates on each read, and reads only assigned measurements', async () => {
    const watch = simulatedWatch({ model: 'FitApp Watch S' })
    const store = memoryStore()
    const source = createWatchSource(watch.bindings, watch.transport, store)

    expect(await source.connect()).toEqual(['steps', 'heart_rate'])
    expect(await source.device()).toBe('FitApp Watch S')
    expect(store.value).toEqual(expect.objectContaining({ watchId: 'sim-1', secret: expect.stringMatching(/^key-/) }))

    const from = new Date('2026-10-16T00:00:00Z')
    const records = await source.read(from, new Date('2026-10-17T00:00:00Z'), ['steps'])
    expect(records).toEqual({ activity: [{ date: '2026-10-16', steps: 4321 }] })
    // The second session used the stored secret (no new pairing) and closed the link.
    expect(watch.log.filter((l) => l.includes('pair')).length).toBe(1)
    expect(watch.log.at(-1)).toBe('disconnect')
  })

  it('reports a refused pairing and stores nothing', async () => {
    const watch = simulatedWatch({ acceptPairing: false })
    const store = memoryStore()
    await expect(createWatchSource(watch.bindings, watch.transport, store).connect()).rejects.toThrow(/refused/)
    expect(store.value).toBeNull()
  })

  it('forgets the pairing on disconnect', async () => {
    const watch = simulatedWatch()
    const store = memoryStore()
    const source = createWatchSource(watch.bindings, watch.transport, store)
    await source.connect()
    await source.disconnect()
    expect(await source.device()).toBeNull()
  })
})
