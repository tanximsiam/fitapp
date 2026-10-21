import { activityKind } from '@/data/activities'
import { mean } from '@/data/derive'
import type { HealthScore } from '@/data/healthScore'
import { addDays } from '@/lib/dates'
import { formatShortDate, formatWeekday } from '@/lib/format'
import type { DaySummary, Goals, ISODate } from '@/types/fitness'
import type { ActivityInput, HydrationInput, JournalData, MealInput, MoodInput } from '@/types/journal'

/**
 * What the AI service may see: numbers, categories and food or exercise names. Never notes, names
 * or anything typed as free text about the person.
 */

const round1 = (n: number | null | undefined) => (n == null ? null : Math.round(n * 10) / 10)

export function scorePayload(s: HealthScore) {
  return {
    score: s.score,
    focus: s.focus,
    week: { active_minutes: s.activityMinutes, active_minutes_target: 150, sleep_hours: s.sleepHours, sleep_hours_target: '7-9' },
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
  | { kind: 'mood'; input: MoodInput }
  | { kind: 'meal'; input: MealInput }
  | { kind: 'drink'; input: HydrationInput }
  | { kind: 'activity'; input: ActivityInput }

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
