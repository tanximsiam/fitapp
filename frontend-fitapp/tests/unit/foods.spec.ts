import { describe, expect, test } from 'vitest'
import { FOODS, findFood, nutrientsFor, searchFoods } from '@/data/foods'
import { loggingStreak } from '@/data/journalDerive'
import type { JournalData } from '@/types/journal'

describe('food list', () => {
  test('scales per-100 g values by amount and unit', () => {
    const rice = findFood('rice-white')!
    expect(nutrientsFor(rice, 100, 'g')).toEqual({ energyKcal: 130, proteinG: 2.7, carbsG: 28.2, fatG: 0.3 })
    // 2 cups × 158 g = 316 g
    expect(nutrientsFor(rice, 2, 'cup')).toEqual({ energyKcal: 411, proteinG: 8.5, carbsG: 89.1, fatG: 0.9 })
    expect(nutrientsFor(rice, 1, 'slice')).toBeNull()
    expect(nutrientsFor(rice, 0, 'g')).toBeNull()
  })

  test('entries are complete and plausible', () => {
    expect(new Set(FOODS.map((f) => f.id)).size).toBe(FOODS.length)
    for (const f of FOODS) {
      const [kcal, p, c, fat] = f.per100g
      // Atwater check: 4/4/9 kcal per gram stays near the listed energy.
      expect(Math.abs(p * 4 + c * 4 + fat * 9 - kcal)).toBeLessThan(Math.max(25, kcal * 0.12))
      for (const g of Object.values(f.units)) expect(g).toBeGreaterThan(0)
    }
  })

  test('search prefers names that start with the query', () => {
    expect(searchFoods('ban')[0].id).toBe('banana')
    expect(searchFoods('rice').map((f) => f.id)).toEqual(['rice-brown', 'rice-white'])
    expect(searchFoods('  ')).toEqual([])
  })
})

describe('logging streak', () => {
  const data = (dates: string[]): JournalData => ({ mood: [], meals: [], cycleDays: [], hydration: dates.map((date, id) => ({ id, date, recordedAt: `${date}T09:00:00Z`, volumeMl: 250, provenance: 'manual', updatedAt: null })) })

  test('counts consecutive days and survives an empty morning', () => {
    expect(loggingStreak(data(['2026-10-19', '2026-10-18', '2026-10-17', '2026-10-15']), '2026-10-19')).toBe(3)
    expect(loggingStreak(data(['2026-10-18', '2026-10-17']), '2026-10-19')).toBe(2)
    expect(loggingStreak(data(['2026-10-16']), '2026-10-19')).toBe(0)
  })
})
