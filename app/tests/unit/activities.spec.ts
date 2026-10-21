import { describe, expect, it } from 'vitest'
import { ACTIVITY_KINDS, estimateKcal } from '@/data/activities'

describe('activity energy estimate', () => {
  it('uses (MET − 1) × 70 kg × hours, rounded to 5 kcal', () => {
    // Jogging, MET 7: 6 × 70 × 0.5 h = 210 kcal.
    expect(estimateKcal('jogging', 30)).toBe(210)
    // Chores, MET 3.3: 2.3 × 70 × 1 h = 161 → 160.
    expect(estimateKcal('chores', 60)).toBe(160)
    expect(estimateKcal('running', 0)).toBe(0)
  })

  it('ranks harder activities higher for the same time', () => {
    const kcal = (t: (typeof ACTIVITY_KINDS)[number]['value']) => estimateKcal(t, 45)
    expect(kcal('yoga')).toBeLessThan(kcal('walking'))
    expect(kcal('walking')).toBeLessThan(kcal('jogging'))
    expect(kcal('jogging')).toBeLessThan(kcal('running'))
  })
})
