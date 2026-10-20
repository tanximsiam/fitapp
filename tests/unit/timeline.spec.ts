import { describe, expect, it } from 'vitest'
import { dayRows } from '@/data/timeline'
import type { DaySummary } from '@/types/fitness'
import type { HydrationEntry, MoodEntry } from '@/types/journal'

const day: DaySummary = {
  date: '2026-10-20',
  activity: { steps: 5000, distanceM: 3600, activeKcal: 200, activeMinutes: 40, source: 'demo' },
  sleep: { startAt: '2026-10-19T23:30:00+06:00', endAt: '2026-10-20T07:00:00+06:00', durationMin: 450, score: null, stages: null, source: 'demo' },
  heartRate: null,
  workouts: [],
  stress: null,
  spo2: null,
  skinTemp: null,
}
const mood: MoodEntry = { id: 1, date: '2026-10-20', provenance: 'manual', updatedAt: null, recordedAt: '2026-10-20T09:15:00+06:00', mood: 4, energy: null, stress: null, emotions: [], note: null }
const water: HydrationEntry = { id: 2, date: '2026-10-20', provenance: 'simulated', updatedAt: null, recordedAt: '2026-10-20T06:00:00+06:00', volumeMl: 250 }
const journal = { mood: [mood], meals: [], hydration: [water], cycleDay: null }
const prefs = { mood: true, food: true, cycle: false }

describe('dayRows', () => {
  it('orders timed records by clock time and puts day totals last', () => {
    expect(dayRows(day, journal, prefs, true).map((r) => r.area)).toEqual(['Water', 'Sleep', 'Mood', 'Activity'])
  })

  it('filters to personal entries or watch records, keeping provenance', () => {
    const own = dayRows(day, journal, prefs, false, 'journal')
    expect(own.map((r) => r.source)).toEqual(['simulated', 'manual'])
    expect(dayRows(day, journal, prefs, false, 'watch').every((r) => r.source === 'watch')).toBe(true)
  })

  it('leaves out trackers that are turned off', () => {
    expect(dayRows(null, journal, { mood: false, food: false, cycle: false }, true)).toEqual([])
  })
})
