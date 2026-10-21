import { defineStore } from 'pinia'
import { errorMessage } from '@/api/client'
import { addDays } from '@/lib/dates'
import { useFitnessStore } from './fitness'
import { useModeStore } from './mode'
import type { ISODate } from '@/types/fitness'
import type {
  CycleDay,
  CycleDayInput,
  EntryId,
  HydrationEntry,
  HydrationInput,
  JournalData,
  Meal,
  MealInput,
  MoodEntry,
  MoodInput,
  TrackerPrefs,
} from '@/types/journal'

/** Same window as watch data, so cross-tracker comparisons line up; cycles need a longer history. */
const FETCH_DAYS = 60
const CYCLE_DAYS = 180

let requestId = 0

export const useJournalStore = defineStore('journal', {
  state: () => ({
    data: { mood: [], meals: [], hydration: [], activities: [], cycleDays: [] } as JournalData,
    prefs: { mood: true, food: true, hydration: true, cycle: false } as TrackerPrefs,
    loading: false,
    loaded: false,
    error: null as string | null,
  }),
  getters: {
    onDate: (s) => (date: ISODate) => ({
      mood: s.data.mood.filter((e) => e.date === date),
      meals: s.data.meals.filter((e) => e.date === date),
      hydration: s.data.hydration.filter((e) => e.date === date),
      activities: s.data.activities.filter((e) => e.date === date),
      cycleDay: s.data.cycleDays.find((e) => e.date === date) ?? null,
    }),
  },
  actions: {
    async load() {
      const id = ++requestId
      const to = useFitnessStore().selectedDate
      const journal = useModeStore().journal
      this.loading = true
      this.error = null
      try {
        const [data, prefs] = await Promise.all([
          journal.list(addDays(to, 1 - FETCH_DAYS), to, addDays(to, -CYCLE_DAYS)),
          this.loaded ? Promise.resolve(this.prefs) : journal.getPrefs(),
        ])
        if (id !== requestId) return
        this.data = data
        this.prefs = prefs
        this.loaded = true
      } catch (err) {
        if (id === requestId) this.error = errorMessage(err, 'Could not load your journal.')
      } finally {
        if (id === requestId) this.loading = false
      }
    },

    ensureLoaded() {
      if (!this.loaded && !this.loading) return this.load()
    },

    /** Runs a write, then reloads; errors (validation, conflicts) are rethrown with a readable message. */
    async write(fn: () => Promise<void>) {
      try {
        await fn()
      } catch (err) {
        throw new Error(errorMessage(err, 'Could not save.'))
      }
      await this.load()
    },

    saveMood(input: MoodInput, existing?: MoodEntry) {
      return this.write(() => useModeStore().journal.saveMood(input, existing))
    },
    saveMeal(input: MealInput, existing?: Meal) {
      return this.write(() => useModeStore().journal.saveMeal(input, existing))
    },
    saveHydration(input: HydrationInput, existing?: HydrationEntry) {
      return this.write(() => useModeStore().journal.saveHydration(input, existing))
    },
    saveCycleDay(date: ISODate, input: CycleDayInput, existing?: CycleDay) {
      return this.write(() => useModeStore().journal.saveCycleDay(date, input, existing))
    },
    remove(kind: 'mood' | 'meals' | 'hydration', id: EntryId) {
      return this.write(() => useModeStore().journal.remove(kind, id))
    },
    removeCycleDay(date: ISODate) {
      return this.write(() => useModeStore().journal.removeCycleDay(date))
    },
    async savePrefs(prefs: TrackerPrefs) {
      this.prefs = await useModeStore().journal.savePrefs(prefs)
    },
  },
})
