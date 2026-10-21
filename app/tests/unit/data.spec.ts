import { describe, expect, test, vi } from 'vitest'
import { api } from '@/api/client'
import { toDaySummary } from '@/api/fitness'
import { createBackendAdapter, createDemoAdapter, demoControls } from '@/data/adapters'
import { syncState } from '@/data/connection'
import { DEMO_WINDOW_DAYS, generateDay, type DemoClock } from '@/data/demo'
import { mean, summarizeHeartRate, trend } from '@/data/derive'
import { addDays, dateRange, todayIn } from '@/lib/dates'
import type { DaySummary, DaySummaryPayload } from '@/types/fitness'

const clock: DemoClock = { today: '2026-10-18', nowMinutes: 14 * 60, offset: '+06:00' }
const window = dateRange(addDays(clock.today, 1 - DEMO_WINDOW_DAYS), clock.today).map((d) => generateDay(d, clock))

describe('demo data', () => {
  test('is deterministic per date', () => {
    expect(generateDay('2026-10-10', clock)).toEqual(generateDay('2026-10-10', { ...clock, today: '2026-10-20' }))
  })

  test('covers the window only and contains realistic gaps', () => {
    expect(generateDay(addDays(clock.today, -DEMO_WINDOW_DAYS), clock).summary.activity).toBeNull()
    expect(generateDay(addDays(clock.today, 1), clock).summary.activity).toBeNull()
    expect(window.some((d) => d.summary.sleep === null)).toBe(true)
    expect(window.some((d) => d.summary.heartRate === null)).toBe(true)
    expect(window.some((d) => d.summary.activity?.activeMinutes === null)).toBe(true)
  })

  test('summaries agree with the underlying samples and stages', () => {
    for (const { summary, samples } of window) {
      if (summary.heartRate) {
        expect(summary.heartRate).toMatchObject(summarizeHeartRate(samples))
        expect(samples.every((s) => s.at.startsWith(summary.date))).toBe(true)
      }
      const s = summary.sleep
      if (s?.stages) {
        const { deepMin, lightMin, remMin, awakeMin } = s.stages
        expect(deepMin! + lightMin! + remMin! + awakeMin!).toBe(s.durationMin)
        expect((Date.parse(s.endAt) - Date.parse(s.startAt)) / 60000).toBe(s.durationMin)
        expect(s.endAt.slice(0, 10)).toBe(summary.date)
      }
    }
  })

  test('today is cut off at the current time', () => {
    const today = window[window.length - 1]
    const full = generateDay(clock.today, { ...clock, nowMinutes: 1439 })
    expect(today.summary.activity!.steps!).toBeLessThan(full.summary.activity!.steps!)
    expect(today.samples.every((s) => s.at.slice(11, 16) < '14:00')).toBe(true)
  })
})

describe('adapters share one contract', () => {
  test('backend payloads normalize to exactly the demo shape', async () => {
    const demo = window.find((d) => d.summary.sleep?.stages && d.summary.heartRate && d.summary.workouts.length)!.summary
    const payload: DaySummaryPayload = {
      workouts: demo.workouts.map((w) => ({
        type: w.type,
        start_at: w.startAt,
        end_at: w.endAt,
        duration_min: w.durationMin,
        active_kcal: w.activeKcal,
        distance_m: w.distanceM,
        avg_bpm: w.avgBpm,
        max_bpm: w.maxBpm,
        source: 'demo',
      })),
      date: demo.date,
      activity: { steps: demo.activity!.steps, distance_m: demo.activity!.distanceM, active_kcal: demo.activity!.activeKcal, active_minutes: demo.activity!.activeMinutes, source: 'demo' },
      sleep: {
        start_at: demo.sleep!.startAt,
        end_at: demo.sleep!.endAt,
        duration_min: demo.sleep!.durationMin,
        score: demo.sleep!.score,
        stages: { deep_min: demo.sleep!.stages!.deepMin, light_min: demo.sleep!.stages!.lightMin, rem_min: demo.sleep!.stages!.remMin, awake_min: demo.sleep!.stages!.awakeMin },
        source: 'demo',
      },
      heart_rate: { ...snake(demo.heartRate!), source: 'demo' },
      stress: { avg: demo.stress!.avg, min: demo.stress!.min, max: demo.stress!.max, sample_count: demo.stress!.sampleCount, source: 'demo' },
      spo2: { avg: demo.spo2!.avg, min: demo.spo2!.min, max: demo.spo2!.max, sample_count: demo.spo2!.sampleCount, source: 'demo' },
      skin_temperature: { deviation_c: demo.skinTemp!.deviationC, source: 'demo' },
    }
    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: { data: [payload], meta: { timezone: 'Asia/Dhaka' } } })

    const backend = await createBackendAdapter().getDays(demo.date, demo.date)
    expect(backend.days[0]).toEqual(demo)
  })

  test('missing backend sections stay null', () => {
    expect(toDaySummary({ date: '2026-10-01', activity: null, sleep: null, heart_rate: null })).toEqual({
      date: '2026-10-01',
      activity: null,
      sleep: null,
      heartRate: null,
      workouts: [],
      stress: null,
      spo2: null,
      skinTemp: null,
    })
  })

  test('ranges months back are populated for every watch signal', () => {
    const old = dateRange(addDays(clock.today, -170), addDays(clock.today, -141)).map((d) => generateDay(d, clock).summary)
    for (const pick of [(d: DaySummary) => d.activity, (d: DaySummary) => d.sleep, (d: DaySummary) => d.stress, (d: DaySummary) => d.spo2, (d: DaySummary) => d.skinTemp]) {
      expect(old.filter(pick).length).toBeGreaterThanOrEqual(24) // 30 days, minus the deliberate gaps
    }
  })

  test('body signal summaries agree with their readings and follow wear', () => {
    for (const { summary, samples, readings } of window) {
      if (summary.stress) {
        const v = readings.stress.map((r) => r.value)
        expect([summary.stress.min, summary.stress.max, summary.stress.sampleCount]).toEqual([Math.min(...v), Math.max(...v), v.length])
        expect(v.every((x) => x >= 0 && x <= 100)).toBe(true)
      }
      // Stress needs heart data; SpO₂ and skin temperature need a recorded night.
      if (!samples.length) expect(summary.stress).toBeNull()
      expect(summary.spo2 === null).toBe(summary.sleep === null)
      expect(summary.skinTemp === null).toBe(summary.sleep === null)
      if (summary.spo2) {
        expect(readings.spo2.every((r) => r.at.startsWith(summary.date) && r.value >= 90 && r.value <= 100)).toBe(true)
        expect(summary.spo2.avg).toBe(Math.round(readings.spo2.reduce((a, r) => a + r.value, 0) / readings.spo2.length))
      }
    }
  })

  test('simulated connection states hide data after the last sync', async () => {
    const now = new Date(2026, 9, 18, 14, 0)
    try {
      demoControls.setScenario('offline')
      const adapter = createDemoAdapter(() => now)
      const status = await adapter.getStatus()
      expect(syncState(status, now)).toBe('stale')
      const { days } = await adapter.getDays('2026-10-15', '2026-10-18')
      expect(days.map((d) => d.activity !== null)).toEqual([true, true, false, false])
      expect(status.latestHeartRate!.at.slice(0, 10)).toBe('2026-10-16')

      demoControls.setScenario('delayed')
      expect(syncState(await adapter.getStatus(), now)).toBe('delayed')
      demoControls.syncNow(now)
      expect(syncState(await adapter.getStatus(), now)).toBe('current')
    } finally {
      demoControls.reset()
    }
  })

  test('demo adapter returns one entry per requested date without network', async () => {
    const get = vi.spyOn(api, 'get')
    const adapter = createDemoAdapter(() => new Date())
    const today = todayIn()
    const { days } = await adapter.getDays(addDays(today, -6), today)
    expect(days.map((d) => d.date)).toEqual(dateRange(addDays(today, -6), today))
    expect(get).not.toHaveBeenCalled()
  })
})

describe('derived values', () => {
  const day = (date: string, steps: number | null): DaySummary => ({
    date,
    activity: steps === null ? null : { steps, distanceM: null, activeKcal: null, activeMinutes: null, source: 'x' },
    sleep: null,
    heartRate: null,
    workouts: [],
  })

  test('averages ignore missing days instead of counting them as zero', () => {
    expect(mean([1000, null, 3000])).toBe(2000)
    expect(mean([null, undefined])).toBeNull()
  })

  test('trend compares the last period with the one before', () => {
    const days = dateRange('2026-10-01', '2026-10-14').map((d, i) => day(d, i < 7 ? 1000 : i === 10 ? null : 1500))
    expect(trend(days, (d) => d.activity?.steps)).toEqual({ current: 1500, previous: 1000, changePct: 50 })
  })
})

function snake(h: NonNullable<DaySummary['heartRate']>) {
  return { resting_bpm: h.restingBpm, min_bpm: h.minBpm, max_bpm: h.maxBpm, avg_bpm: h.avgBpm, sample_count: h.sampleCount }
}
