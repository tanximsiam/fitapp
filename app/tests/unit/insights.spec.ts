import { describe, expect, test } from 'vitest'
import { analyse, summarise, type AnalysisInput } from '@/insights/engine'
import { dateRange } from '@/lib/dates'
import type { DaySummary } from '@/types/fitness'
import type { CycleDay, JournalData, Meal, MoodEntry } from '@/types/journal'

const END = '2026-10-14'
const DATES = dateRange('2026-10-01', END) // 14 days: previous week + current week

function day(date: string, steps: number | null, sleepMin: number | null, resting: number | null = 60): DaySummary {
  return {
    date,
    activity: steps === null ? null : { steps, distanceM: null, activeKcal: null, activeMinutes: null, source: 'w' },
    sleep: sleepMin === null ? null : { startAt: `${date}T00:00:00+06:00`, endAt: `${date}T07:00:00+06:00`, durationMin: sleepMin, score: null, stages: null, source: 'w' },
    heartRate: resting === null ? null : { restingBpm: resting, minBpm: null, maxBpm: null, avgBpm: null, sampleCount: 0, source: 'w' },
    workouts: [],
  }
}
const mood = (date: string, m: number, energy: number | null): MoodEntry => ({
  id: date,
  date,
  provenance: 'manual',
  updatedAt: null,
  recordedAt: `${date}T21:00:00+06:00`,
  mood: m,
  energy,
  stress: null,
  emotions: [],
  note: null,
})
const meal = (date: string, i: number): Meal => ({
  id: `${date}${i}`,
  date,
  provenance: 'manual',
  updatedAt: null,
  eatenAt: `${date}T12:00:00+06:00`,
  mealType: 'lunch',
  note: null,
  items: [{ name: 'x', quantity: null, unit: null, energyKcal: null, proteinG: null, carbsG: null, fatG: null, nutritionSource: null }],
})
const empty: JournalData = { mood: [], meals: [], hydration: [], cycleDays: [] }

const input = (over: Partial<AnalysisInput>): AnalysisInput => ({
  days: DATES.map((d, i) => day(d, i < 7 ? 6000 : 9000, 420)),
  journal: empty,
  goals: { steps: 8000, activeKcal: 400, distanceM: 5000, sleepMin: 450 },
  prefs: { mood: true, food: true, cycle: true },
  end: END,
  windowDays: 7,
  ...over,
})
const find = (list: ReturnType<typeof analyse>, id: string) => list.find((i) => i.id === id)!

describe('wellbeing insights', () => {
  test('goal days and comparisons are counted from the records with denominators', () => {
    const days = DATES.map((d, i) => day(d, i < 7 ? 6000 : i % 2 ? 9000 : null, 420))
    const out = analyse(input({ days }))
    // Current week (Oct 8–14): steps on 4 of 7 days, all above the goal.
    expect(find(out, 'activity-goal').text).toBe('Your watch recorded your step goal of 8,000 being reached on 4 of 4 days with step data.')
    expect(find(out, 'activity-change').text).toBe('Average daily steps were 9,000, 50% higher than the previous period (6,000).')
    expect(find(out, 'activity-goal').range).toEqual({ from: '2026-10-08', to: END })
  })

  test('statements are withheld below the minimum data', () => {
    const days = DATES.map((d, i) => day(d, i < 7 ? null : i < 9 ? 9000 : null, null, null))
    const out = analyse(input({ days }))
    expect(find(out, 'activity-goal')).toMatchObject({ status: 'insufficient', text: 'Not enough step data for Oct 8–Oct 14: 2 of 7 days recorded, 4 needed.' })
    expect(find(out, 'sleep-average').status).toBe('insufficient')
    expect(find(out, 'resting-hr').status).toBe('insufficient')
    expect(find(out, 'energy-sleep').status).toBe('insufficient')
    expect(summarise(out)).not.toContain(expect.stringContaining('step goal'))
  })

  test('low energy and shorter sleep are described as co-occurrence with counts', () => {
    const sleep = [480, 480, 360, 380, 470, 350, 490] // Oct 8–14
    const energy = [4, 4, 2, 1, 4, 2, 3]
    const days = DATES.map((d, i) => day(d, 9000, i < 7 ? 420 : sleep[i - 7]))
    const journal = { ...empty, mood: DATES.slice(7).map((d, i) => mood(d, 3, energy[i])) }
    const i = find(analyse(input({ days, journal })), 'energy-sleep')
    expect(i.status).toBe('ok')
    // Median of the 7 nights is 470; the three low-energy days all slept less.
    expect(i.text).toContain('low energy (2 or less) on 3 days; on 3 of them')
    expect(i.text).toContain('On the other 4 days with both records, 0 had less sleep')
    expect(i.text).toContain('not that one caused the other')
  })

  test('food overview reports incompleteness', () => {
    const journal = { ...empty, meals: [meal('2026-10-13', 0), meal('2026-10-14', 0)] }
    expect(find(analyse(input({ journal })), 'food-completeness').text).toBe(
      'Only 2 meals were logged on 2 of 7 days, so the food overview is incomplete.',
    )
  })

  test('cycle symptoms need three recorded periods', () => {
    const cd = (date: string, cramps: boolean): CycleDay => ({ id: date, date, provenance: 'manual', updatedAt: null, flow: 'medium', symptoms: cramps ? ['cramps'] : [], note: null })
    const two = { ...empty, cycleDays: [cd('2026-08-01', true), cd('2026-08-29', true)] }
    expect(find(analyse(input({ journal: two })), 'cycle-symptoms').status).toBe('insufficient')
    const three = { ...empty, cycleDays: [...two.cycleDays, cd('2026-09-27', false)] }
    expect(find(analyse(input({ journal: three })), 'cycle-symptoms').text).toBe('2 of your last 3 recorded periods included cramps during the first two days.')
  })

  test('body signals are summarised, and skipped when the source never provides them', () => {
    const sig = (avg: number, min: number) => ({ avg, min, max: avg + 5, sampleCount: 10, source: 'w' })
    const days = DATES.map((d, i) => ({
      ...day(d, 9000, 420),
      stress: sig(i < 7 ? 40 : 30, 10),
      spo2: i >= 7 ? sig(96, i === 10 ? 92 : 94) : null,
      skinTemp: i >= 7 ? { deviationC: i === 8 ? -0.4 : 0.2, source: 'w' } : null,
    }))
    const out = analyse(input({ days }))
    expect(find(out, 'stress-average').text).toBe("Your watch's stress estimate averaged 30 out of 100 over 7 days, 25% lower than the previous period (40 of 100).")
    expect(find(out, 'spo2-nights').text).toBe('Overnight blood oxygen averaged 96% over 7 nights; the lowest single reading was 92%.')
    expect(find(out, 'skin-temperature').text).toBe('Skin temperature stayed between −0.40 °C and +0.20 °C of your baseline over 7 nights.')

    const ids = analyse(input({})).map((i) => i.id)
    expect(ids).not.toContain('stress-average')
    expect(ids).not.toContain('spo2-nights')
    expect(ids).not.toContain('skin-temperature')
  })

  test('disabled trackers produce no statements', () => {
    const ids = analyse(input({ prefs: { mood: false, food: false, cycle: false } })).map((i) => i.area)
    expect(ids).not.toContain('mood')
    expect(ids).not.toContain('food')
    expect(ids).not.toContain('cycle')
  })
})
