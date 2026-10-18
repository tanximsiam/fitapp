import { mean } from './derive'
import type { ISODate } from '@/types/fitness'
import type { Meal, MoodEntry } from '@/types/journal'

/** Mean of a mood field per date, over the entries that recorded it. */
export function dailyMoodMean(entries: MoodEntry[], pick: (e: MoodEntry) => number | null): Map<ISODate, number> {
  const byDate = new Map<ISODate, number[]>()
  for (const e of entries) {
    const v = pick(e)
    if (v != null) byDate.set(e.date, [...(byDate.get(e.date) ?? []), v])
  }
  return new Map([...byDate].map(([d, vs]) => [d, mean(vs)!]))
}

export function topCounts(values: string[], limit = 5): [string, number][] {
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit)
}

/**
 * Sum of the energy values the user entered for a meal. `entered` and `total` show how complete it
 * is; the sum is never extrapolated to items without a value.
 */
export function enteredEnergy(meals: Meal[]) {
  const items = meals.flatMap((m) => m.items)
  const withValue = items.filter((i) => i.energyKcal != null)
  return {
    kcal: withValue.length ? withValue.reduce((a, i) => a + (i.energyKcal ?? 0), 0) : null,
    entered: withValue.length,
    total: items.length,
  }
}

export const MOOD_LABELS = ['Very low', 'Low', 'Okay', 'Good', 'Great']
export const ENERGY_LABELS = ['Drained', 'Low', 'Steady', 'Good', 'High']
export const STRESS_LABELS = ['None', 'Mild', 'Some', 'High', 'Very high']
