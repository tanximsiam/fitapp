import { describe, expect, it } from 'vitest'
import { activityPoints, healthScore, heartPoints, hydrationPoints, regularityPoints, scoreLabel, sleepPoints, stepPoints } from '@/data/healthScore'
import type { DaySummary } from '@/types/fitness'
import type { ActivityEntry, HydrationEntry } from '@/types/journal'

const day = (date: string, o: { minutes?: number; steps?: number; sleepMin?: number; bedtime?: string; rhr?: number } = {}): DaySummary => ({
  date,
  activity: o.steps == null && o.minutes == null ? null : { steps: o.steps ?? 0, distanceM: 0, activeKcal: 0, activeMinutes: o.minutes ?? null, source: 'w' },
  sleep:
    o.sleepMin == null
      ? null
      : { startAt: `${date}T${o.bedtime ?? '23:00'}:00+06:00`, endAt: `${date}T07:00:00+06:00`, durationMin: o.sleepMin, score: null, stages: null, source: 'w' },
  heartRate: o.rhr == null ? null : { restingBpm: o.rhr, minBpm: null, maxBpm: null, avgBpm: null, sampleCount: 0, source: 'w' },
  workouts: [],
  stress: null,
  spo2: null,
  skinTemp: null,
})
const water = (date: string, volumeMl: number): HydrationEntry => ({ id: date + volumeMl, date, provenance: 'manual', updatedAt: null, recordedAt: `${date}T10:00:00Z`, volumeMl })
const logged = (date: string, type: ActivityEntry['activityType'], durationMin: number): ActivityEntry => ({
  id: `${date}${type}`, date, provenance: 'manual', updatedAt: null, startedAt: `${date}T18:00:00Z`, activityType: type, durationMin, energyKcal: null, energySource: null, exercises: [],
})
const week = (o: Parameters<typeof day>[1]) => Array.from({ length: 7 }, (_, i) => day(`2026-10-${14 + i}`, o))
const today = '2026-10-21'

describe('part scores', () => {
  it('follow their guidelines', () => {
    expect([0, 30, 90, 150].map(activityPoints)).toEqual([0, 40, 80, 100])
    expect([1000, 5000, 8000, 12000].map(stepPoints)).toEqual([0, 50, 100, 100])
    expect([4.5, 6.5, 8, 9.5, 10.5].map(sleepPoints)).toEqual([20, 70, 100, 85, 40])
    expect([20, 50, 100].map(regularityPoints)).toEqual([100, 70, 25])
    expect([55, 72, 95].map(heartPoints)).toEqual([100, 70, 25])
    expect([1.2, 0.8, 0.3].map(hydrationPoints)).toEqual([100, 75, 25])
    expect([90, 75, 55, 30].map(scoreLabel)).toEqual(['Excellent', 'Good', 'Fair', 'Needs attention'])
  })
})

describe('health score', () => {
  it('averages the measured parts over the 7 complete days before today', () => {
    // 7×25 = 175 min → 100; 8,000 steps → 100; 7.5 h → 100; same bedtime → 100; 58 bpm → 100; no water goal.
    const s = healthScore(week({ minutes: 25, steps: 8000, sleepMin: 450, rhr: 58 }), { hydration: [] }, today, null)
    expect(s).toMatchObject({ score: 100, label: 'Excellent', focus: null })
    expect(s!.parts.map((p) => p.part)).toEqual(['activity', 'steps', 'sleep', 'regularity', 'heart'])
  })

  it('points at the weakest part', () => {
    const days = week({ minutes: 5, steps: 9000, sleepMin: 450, rhr: 58 })
    // 35 active minutes → 40 points, everything else full.
    expect(healthScore(days, { hydration: [] }, today, null)).toMatchObject({ score: 88, focus: 'activity' })
  })

  it('scores irregular bedtimes lower', () => {
    const days = ['21:00', '01:30', '22:00', '02:30', '23:00', '00:30', '21:30'].map((b, i) => day(`2026-10-${14 + i}`, { sleepMin: 450, bedtime: b }))
    expect(healthScore(days, { hydration: [] }, today, null)!.parts.find((p) => p.part === 'regularity')!.points).toBeLessThan(100)
  })

  it('counts hand-logged moderate activity and water against the goal', () => {
    const s = healthScore([], { activities: [logged('2026-10-20', 'jogging', 40), logged('2026-10-20', 'yoga', 60)], hydration: [water('2026-10-20', 1000)] }, today, 2000)
    expect(s!.parts).toEqual([
      { part: 'activity', points: 40, value: 40 },
      { part: 'hydration', points: 50, value: 50 },
    ])
  })

  it('leaves out today and anything older than a week, and is null without data', () => {
    expect(healthScore([day(today, { steps: 3000 }), day('2026-10-01', { steps: 3000 })], { hydration: [] }, today, null)).toBeNull()
  })
})
