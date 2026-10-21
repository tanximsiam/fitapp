import type { ISODate } from './fitness'

/**
 * Manually entered records. Provenance is explicit so the UI never presents them as watch data;
 * demo fixtures are marked "simulated" until the visitor edits them.
 */
export type Provenance = 'manual' | 'simulated'
export type EntryId = number | string
/** A change made on this device that the server has not accepted yet. */
export type SyncState = 'pending' | 'conflict' | 'rejected'

interface Entry {
  id: EntryId
  date: ISODate
  provenance: Provenance
  /** Concurrency token from the backend; null for demo records. */
  updatedAt: string | null
  /** Set only on records changed offline and not yet on the server. */
  syncState?: SyncState
}

export interface MoodEntry extends Entry {
  recordedAt: string
  mood: number
  energy: number | null
  /** Self-reported, 1–5. Never derived from the watch. */
  stress: number | null
  emotions: string[]
  note: string | null
}

export interface MealItem {
  name: string
  quantity: number | null
  unit: string | null
  /** Typed by the user, or estimated from FitApp's food list (see nutritionSource). */
  energyKcal: number | null
  proteinG: number | null
  carbsG: number | null
  fatG: number | null
  /** "database": calculated from src/data/foods.ts; "entered": typed by the user; null: no values. */
  nutritionSource: 'database' | 'entered' | null
}

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
export type MealType = (typeof MEAL_TYPES)[number]

export interface Meal extends Entry {
  eatenAt: string
  mealType: MealType
  note: string | null
  items: MealItem[]
}

export interface HydrationEntry extends Entry {
  recordedAt: string
  volumeMl: number
}

export const ACTIVITY_TYPES = ['chores', 'walking', 'jogging', 'running', 'cycling', 'swimming', 'workout', 'yoga', 'other'] as const
export type ActivityType = (typeof ACTIVITY_TYPES)[number]

/** One line of a logged workout. Minutes are optional; without them a set counts as two minutes. */
export interface WorkoutExercise {
  name: string
  sets: number
  reps: number | null
  durationMin: number | null
}

/** An activity the person logged by hand; never added to the watch's activity totals. */
export interface ActivityEntry extends Entry {
  startedAt: string
  activityType: ActivityType
  durationMin: number
  energyKcal: number | null
  /** "estimated" by the app from the activity and time, or "entered" by the person. */
  energySource: 'estimated' | 'entered' | null
  /** For a workout: what was done. Empty for other activities. */
  exercises: WorkoutExercise[]
}

export const FLOWS = ['spotting', 'light', 'medium', 'heavy'] as const
export type Flow = (typeof FLOWS)[number]
export const SYMPTOMS = ['cramps', 'headache', 'bloating', 'back_pain', 'breast_tenderness', 'acne', 'fatigue', 'nausea', 'mood_changes', 'cravings'] as const
export type Symptom = (typeof SYMPTOMS)[number]

export interface CycleDay extends Entry {
  flow: Flow | null
  symptoms: Symptom[]
  note: string | null
}

export interface JournalData {
  mood: MoodEntry[]
  meals: Meal[]
  hydration: HydrationEntry[]
  activities: ActivityEntry[]
  cycleDays: CycleDay[]
}

export interface TrackerPrefs {
  mood: boolean
  food: boolean
  hydration: boolean
  cycle: boolean
}

export type MoodInput = Pick<MoodEntry, 'recordedAt' | 'mood' | 'energy' | 'stress' | 'emotions' | 'note'>
export type MealInput = Pick<Meal, 'eatenAt' | 'mealType' | 'note' | 'items'>
export type HydrationInput = Pick<HydrationEntry, 'recordedAt' | 'volumeMl'>
export type ActivityInput = Pick<ActivityEntry, 'startedAt' | 'activityType' | 'durationMin' | 'energyKcal' | 'energySource' | 'exercises'>
export type CycleDayInput = Pick<CycleDay, 'flow' | 'symptoms' | 'note'>

export interface JournalAdapter {
  /** Mood, meals and hydration for [from, to]; cycle days for [cycleFrom, to]. */
  list(from: ISODate, to: ISODate, cycleFrom: ISODate): Promise<JournalData>
  saveMood(input: MoodInput, existing?: MoodEntry): Promise<void>
  saveMeal(input: MealInput, existing?: Meal): Promise<void>
  saveHydration(input: HydrationInput, existing?: HydrationEntry): Promise<void>
  saveActivity(input: ActivityInput, existing?: ActivityEntry): Promise<void>
  saveCycleDay(date: ISODate, input: CycleDayInput, existing?: CycleDay): Promise<void>
  remove(kind: 'mood' | 'meals' | 'hydration' | 'activities', id: EntryId): Promise<void>
  removeCycleDay(date: ISODate): Promise<void>
  getPrefs(): Promise<TrackerPrefs>
  savePrefs(prefs: TrackerPrefs): Promise<TrackerPrefs>
}
