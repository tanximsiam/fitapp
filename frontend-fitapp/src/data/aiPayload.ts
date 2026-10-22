import { activityKind } from '@/data/activities'
import { mean } from '@/data/derive'
import type { HealthScore } from '@/data/healthScore'
import { addDays } from '@/lib/dates'
import { formatShortDate, formatWeekday } from '@/lib/format'
import type { DaySummary, Goals, ISODate } from '@/types/fitness'
import type { ActivityEntry, HydrationEntry, JournalData, Meal, MoodEntry } from '@/types/journal'

/**
 * What the AI service may see: numbers, categories and food or exercise names. Never notes, names
 * or anything typed as free text about the person.
 */

const round1 = (n: number | null | undefined) => (n == null ? null : Math.round(n * 10) / 10)

const PART_NAMES = {
  activity: 'active_minutes_per_week (target 150)',
  steps: 'average_daily_steps (target 8000)',
  sleep: 'average_sleep_hours (target 7-9)',
  regularity: 'sleep_midpoint_spread_minutes (lower is better, 30 or less is best)',
  heart: 'average_resting_heart_rate_bpm (60 or less is best)',
  hydration: 'percent_of_water_goal',
} as const

/** The score, the week's numbers behind it and today so far: a new log changes it, so the coach answers anew. */
export function coachPayload(s: HealthScore, today: ReturnType<typeof todayPayload>) {
  return {
    score: s.score,
    label: s.label,
    focus: s.focus,
    week: Object.fromEntries(s.parts.map((p) => [PART_NAMES[p.part], p.value])),
    today,
  }
}

/** One day as numbers, for the feedback context and the insights summary. */
function dayNumbers(date: ISODate, days: DaySummary[], journal: JournalData) {
  const d = days.find((x) => x.date === date)
  const on = <T extends { date: ISODate }>(list: T[]) => list.filter((e) => e.date === date)
  const mood = on(journal.mood)
  return {
    // Written as people say it; the model should not work out weekdays itself.
    day: `${formatWeekday(date).slice(0, 3)}, ${formatShortDate(date)}`,
    steps: d?.activity?.steps ?? null,
    active_minutes: d?.activity?.activeMinutes ?? null,
    active_kcal: d?.activity?.activeKcal ?? null,
    sleep_hours: round1(d?.sleep ? d.sleep.durationMin / 60 : null),
    resting_hr: d?.heartRate?.restingBpm ?? null,
    stress: d?.stress?.avg ?? null,
    mood: round1(mean(mood.map((e) => e.mood))),
    energy: round1(mean(mood.map((e) => e.energy))),
    water_ml: on(journal.hydration).reduce((n, h) => n + h.volumeMl, 0) || null,
    meals: on(journal.meals).length || null,
    logged_activity_minutes: on(journal.activities ?? []).reduce((n, a) => n + a.durationMin, 0) || null,
  }
}

export function todayPayload(today: ISODate, days: DaySummary[], journal: JournalData, goals: Goals) {
  return { ...dayNumbers(today, days, journal), goals: { steps: goals.steps, active_kcal: goals.activeKcal, sleep_hours: round1(goals.sleepMin / 60), water_ml: goals.waterMl } }
}

export function insightsPayload(end: ISODate, span: number, days: DaySummary[], journal: JournalData, goals: Goals) {
  return {
    days: Array.from({ length: span }, (_, i) => dayNumbers(addDays(end, i - span + 1), days, journal)),
    goals: { steps: goals.steps, active_kcal: goals.activeKcal, sleep_hours: round1(goals.sleepMin / 60), water_ml: goals.waterMl },
  }
}

export type SavedEntry =
  | { kind: 'mood'; input: MoodEntry }
  | { kind: 'meal'; input: Meal }
  | { kind: 'drink'; input: HydrationEntry }
  | { kind: 'activity'; input: ActivityEntry }

export function entryPayload(e: SavedEntry) {
  switch (e.kind) {
    case 'mood':
      return { mood_1_to_5: e.input.mood, energy_1_to_5: e.input.energy, stress_1_to_5: e.input.stress, emotions: e.input.emotions }
    case 'meal':
      return { meal: e.input.mealType, foods: e.input.items.map((i) => ({ food: i.name, kcal: i.energyKcal, protein_g: i.proteinG })) }
    case 'drink':
      return { water_ml: e.input.volumeMl }
    case 'activity':
      return {
        activity: activityKind(e.input.activityType).label,
        minutes: e.input.durationMin,
        kcal: e.input.energyKcal,
        exercises: e.input.exercises.map((x) => ({ exercise: x.name, sets: x.sets, reps: x.reps, minutes: x.durationMin })),
      }
  }
}
