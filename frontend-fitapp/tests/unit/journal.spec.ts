import { beforeEach, describe, expect, test, vi } from 'vitest'
import { api } from '@/api/client'
import { createBackendJournal } from '@/api/journal'
import { cycleSummary, deriveCycles, derivePeriods } from '@/data/cycle'
import { DEMO_CYCLE_DAYS, createDemoJournal, resetDemoJournal } from '@/data/demoJournal'
import type { DemoClock } from '@/data/demo'
import { enteredEnergy } from '@/data/journalDerive'
import { addDays } from '@/lib/dates'
import type { CycleDay, Flow, Meal } from '@/types/journal'

const clock: DemoClock = { today: '2026-10-18', nowMinutes: 14 * 60, offset: '+06:00' }
const cd = (date: string, flow: Flow | null, symptoms: CycleDay['symptoms'] = []): CycleDay => ({ id: date, date, flow, symptoms, note: null, provenance: 'manual', updatedAt: null })

describe('cycle derivation', () => {
  test('periods are runs of bleeding; spotting never starts one; a one-day gap does not split', () => {
    const periods = derivePeriods([
      cd('2026-07-30', 'spotting'),
      cd('2026-08-01', 'medium'),
      cd('2026-08-02', 'heavy'),
      cd('2026-08-04', 'light'), // gap of one day
      cd('2026-08-05', 'spotting'),
      cd('2026-08-20', null, ['bloating']),
      cd('2026-08-29', 'light'),
      cd('2026-08-30', 'light'),
    ])
    expect(periods.map((p) => [p.start, p.end, p.lengthDays])).toEqual([
      ['2026-08-01', '2026-08-05', 5],
      ['2026-08-29', '2026-08-30', 2],
    ])
  })

  test('cycle summaries use observed starts only', () => {
    const periods = derivePeriods([cd('2026-06-01', 'heavy'), cd('2026-06-27', 'heavy'), cd('2026-07-28', 'heavy')])
    const cycles = deriveCycles(periods)
    expect(cycles.map((c) => c.lengthDays)).toEqual([26, 31])
    expect(cycleSummary(cycles, periods)).toMatchObject({ completedCycles: 2, recordedPeriods: 3, avgCycleDays: 28.5, shortestCycleDays: 26, longestCycleDays: 31 })
    expect(cycleSummary([], derivePeriods([cd('2026-06-01', 'heavy')])).avgCycleDays).toBeNull()
  })
})

describe('demo journal', () => {
  beforeEach(() => resetDemoJournal())
  const adapter = () => createDemoJournal(() => clock)
  const list = () => adapter().list(addDays(clock.today, -29), clock.today, addDays(clock.today, -DEMO_CYCLE_DAYS))

  test('has realistic coverage, at least three completed cycles and nothing after now', async () => {
    const data = await list()
    expect(new Set(data.mood.map((e) => e.date)).size).toBeGreaterThan(15)
    expect(new Set(data.mood.map((e) => e.date)).size).toBeLessThan(30)
    expect(deriveCycles(derivePeriods(data.cycleDays)).length).toBeGreaterThanOrEqual(3)
    const late = [...data.mood.map((e) => e.recordedAt), ...data.meals.map((m) => m.eatenAt)].filter((t) => t.startsWith(clock.today) && t.slice(11, 16) > '14:00')
    expect(late).toEqual([])
    expect(data.mood.every((e) => e.provenance === 'simulated')).toBe(true)
  })

  test('adds, edits and deletes entries locally until reset', async () => {
    const j = adapter()
    await j.saveMood({ recordedAt: '2026-10-18T09:00:00+06:00', mood: 4, energy: null, stress: null, emotions: [], note: null })
    let mine = (await list()).mood.filter((e) => e.provenance === 'manual')
    expect(mine).toHaveLength(1)

    await j.saveMood({ ...mine[0], mood: 2 }, mine[0])
    mine = (await list()).mood.filter((e) => e.provenance === 'manual')
    expect(mine.map((e) => e.mood)).toEqual([2])

    const fixture = (await list()).meals[0]
    await j.remove('meals', fixture.id)
    expect((await list()).meals.find((m) => m.id === fixture.id)).toBeUndefined()

    resetDemoJournal()
    const restored = await list()
    expect(restored.mood.some((e) => e.provenance === 'manual')).toBe(false)
    expect(restored.meals.find((m) => m.id === fixture.id)).toBeDefined()
  })
})

describe('food values', () => {
  test('entered energy sums only values the user typed and reports completeness', () => {
    const meal = (kcals: (number | null)[]): Meal => ({
      id: 1,
      date: '2026-10-18',
      provenance: 'manual',
      updatedAt: null,
      eatenAt: '2026-10-18T12:00:00+06:00',
      mealType: 'lunch',
      note: null,
      items: kcals.map((k, i) => ({ name: `f${i}`, quantity: null, unit: null, energyKcal: k, proteinG: null, carbsG: null, fatG: null, nutritionSource: k == null ? null : 'entered' })),
    })
    expect(enteredEnergy([meal([200, null]), meal([150])])).toEqual({ kcal: 350, entered: 2, estimated: 0, total: 3 })
    expect(enteredEnergy([meal([null])])).toEqual({ kcal: null, entered: 0, estimated: 0, total: 1 })
  })
})

describe('backend journal adapter', () => {
  test('normalizes payloads and sends the concurrency token on edit', async () => {
    vi.spyOn(api, 'get').mockImplementation(async (url: string) => ({
      data: {
        data: url.endsWith('/mood')
          ? [{ id: 5, date: '2026-10-18', provenance: 'manual', updated_at: '2026-10-18T03:00:00Z', recorded_at: '2026-10-18T09:00:00+06:00', mood: 4, energy: null, stress: 2, emotions: ['calm'], note: null }]
          : [],
      },
    }))
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: {} })
    const j = createBackendJournal()
    const data = await j.list('2026-10-01', '2026-10-18', '2026-05-01')
    expect(data.mood[0]).toEqual({ id: 5, date: '2026-10-18', provenance: 'manual', updatedAt: '2026-10-18T03:00:00Z', recordedAt: '2026-10-18T09:00:00+06:00', mood: 4, energy: null, stress: 2, emotions: ['calm'], note: null })

    await j.saveMood({ ...data.mood[0], mood: 3 }, data.mood[0])
    expect(put).toHaveBeenCalledWith('/journal/mood/5', expect.objectContaining({ mood: 3, updated_at: '2026-10-18T03:00:00Z' }))
  })
})
