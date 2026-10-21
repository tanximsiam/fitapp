import { describe, expect, it } from 'vitest'
import { activityPoints, healthScore, sleepPoints } from '@/data/healthScore'
import type { DaySummary } from '@/types/fitness'
import type { ActivityEntry } from '@/types/journal'

const day = (date: string, activeMinutes: number | null, sleepMin: number | null): DaySummary => ({
  date,
  activity: activeMinutes == null ? null : { steps: 5000, distanceM: 3500, activeKcal: 200, activeMinutes, source: 'w' },
  sleep: sleepMin == null ? null : { startAt: `${date}T00:00:00Z`, endAt: `${date}T07:00:00Z`, durationMin: sleepMin, score: null, stages: null, source: 'w' },
  heartRate: null,
  workouts: [],
  stress: null,
  spo2: null,
  skinTemp: null,
})
const logged = (date: string, type: ActivityEntry['activityType'], durationMin: number): ActivityEntry => ({
  id: `${date}${type}`, date, provenance: 'manual', updatedAt: null, startedAt: `${date}T18:00:00Z`, activityType: type, durationMin, energyKcal: null, energySource: null, exercises: [],
})

describe('Life’s Essential 8 bands', () => {
  it('scores weekly activity minutes', () => {
    expect([0, 1, 30, 60, 90, 120, 149, 150, 400].map(activityPoints)).toEqual([0, 20, 40, 60, 80, 90, 90, 100, 100])
  })
  it('scores average sleep hours', () => {
    expect([3.9, 4, 5, 6, 7, 8.9, 9, 10].map(sleepPoints)).toEqual([0, 20, 40, 70, 100, 100, 90, 40])
  })
})

describe('health score', () => {
  const today = '2026-10-21'

  it('averages activity and sleep over the last 7 days', () => {
    // 7 × 20 min = 140 → 90 points; 6.5 h → 70 points; average 80.
    const days = Array.from({ length: 7 }, (_, i) => day(`2026-10-${15 + i}`, 20, 390))
    expect(healthScore(days, [], today)).toEqual({ score: 80, activityMinutes: 140, sleepHours: 6.5, focus: 'sleep' })
  })

  it('counts moderate activities logged by hand, without double counting the watch', () => {
    const days = [day('2026-10-20', 30, 480)]
    const acts = [logged('2026-10-20', 'jogging', 40), logged('2026-10-19', 'chores', 60), logged('2026-10-19', 'yoga', 60)]
    // Oct 20: max(30, 40) = 40; Oct 19: chores 60 (yoga is below moderate) → 100 min → 80 points.
    expect(healthScore(days, acts, today)).toMatchObject({ activityMinutes: 100, score: 90, focus: 'activity' })
  })

  it('ignores data outside the week and gives null without any data', () => {
    expect(healthScore([day('2026-10-01', 200, 480)], [], today)).toBeNull()
    expect(healthScore([day('2026-10-21', null, 480)], [], today)).toEqual({ score: 100, activityMinutes: null, sleepHours: 8, focus: null })
  })
})
