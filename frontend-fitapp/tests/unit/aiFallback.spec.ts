import { describe, expect, it } from 'vitest'
import { fallbackInsights } from '@/data/aiFallback'
import type { insightsPayload } from '@/data/aiPayload'

type Payload = ReturnType<typeof insightsPayload>
const blank = { day: 'Mon, Oct 12', steps: null, active_minutes: null, active_kcal: null, sleep_hours: null, resting_hr: null, stress: null, mood: null, energy: null, water_ml: null, meals: null, logged_activity_minutes: null }
const payload = (days: Partial<Payload['days'][number]>[]): Payload => ({
  days: days.map((d) => ({ ...blank, ...d })),
  goals: { steps: 8000, active_kcal: 450, sleep_hours: 7.5, water_ml: 2000 },
})

describe('fallbackInsights', () => {
  it('compares energy after long and short nights', () => {
    const p = payload([
      { sleep_hours: 8, energy: 4 },
      { sleep_hours: 7.5, energy: 4 },
      { sleep_hours: 6, energy: 2 },
      { sleep_hours: 5.5, energy: 3 },
    ])
    const sleep = fallbackInsights(p).find((i) => i.area === 'sleep')
    expect(sleep?.body).toContain('energy averaged 4 of 5, against 2.5')
  })

  it('leaves a comparison out without two days on each side', () => {
    const p = payload([
      { sleep_hours: 8, energy: 4 },
      { sleep_hours: 6, energy: 2 },
      { sleep_hours: 5, energy: 2 },
    ])
    expect(fallbackInsights(p).some((i) => i.area === 'sleep')).toBe(false)
  })

  it('falls back to a summary of steps and sleep, and never returns more than three', () => {
    expect(fallbackInsights(payload([{ steps: 9000, sleep_hours: 7 }]))[0].area).toBe('activity')
    expect(fallbackInsights(payload([]))).toEqual([])
  })
})
