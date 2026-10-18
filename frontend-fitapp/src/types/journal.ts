import type { ISODate } from './fitness'

/**
 * Manually entered records. Provenance is explicit so the UI never presents them as watch data;
 * demo fixtures are marked "simulated" until the visitor edits them.
 */
export type Provenance = 'manual' | 'simulated'
export type EntryId = number | string

interface Entry {
  id: EntryId
  date: ISODate
  provenance: Provenance
  /** Concurrency token from the backend; null for demo records. */
  updatedAt: string | null
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
  /** Values the user typed in; FitApp never fills these. */
  energyKcal: number | null
  proteinG: number | null
  carbsG: number | null
  fatG: number | null
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
  cycleDays: CycleDay[]
}

export interface TrackerPrefs {
  mood: boolean
  food: boolean
  cycle: boolean
}

export type MoodInput = Pick<MoodEntry, 'recordedAt' | 'mood' | 'energy' | 'stress' | 'emotions' | 'note'>
export type MealInput = Pick<Meal, 'eatenAt' | 'mealType' | 'note' | 'items'>
export type HydrationInput = Pick<HydrationEntry, 'recordedAt' | 'volumeMl'>
export type CycleDayInput = Pick<CycleDay, 'flow' | 'symptoms' | 'note'>

export interface JournalAdapter {
  /** Mood, meals and hydration for [from, to]; cycle days for [cycleFrom, to]. */
  list(from: ISODate, to: ISODate, cycleFrom: ISODate): Promise<JournalData>
  saveMood(input: MoodInput, existing?: MoodEntry): Promise<void>
  saveMeal(input: MealInput, existing?: Meal): Promise<void>
  saveHydration(input: HydrationInput, existing?: HydrationEntry): Promise<void>
  saveCycleDay(date: ISODate, input: CycleDayInput, existing?: CycleDay): Promise<void>
  remove(kind: 'mood' | 'meals' | 'hydration', id: EntryId): Promise<void>
  removeCycleDay(date: ISODate): Promise<void>
  getPrefs(): Promise<TrackerPrefs>
  savePrefs(prefs: TrackerPrefs): Promise<TrackerPrefs>
}
