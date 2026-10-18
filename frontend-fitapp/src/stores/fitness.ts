import { defineStore } from 'pinia'
import { errorMessage } from '@/api/client'
import { DEFAULT_GOALS } from '@/data/adapters'
import { addDays, todayIn } from '@/lib/dates'
import { useJournalStore } from './journal'
import { useModeStore } from './mode'
import type { DataStatus, DaySummary, Goals, ISODate } from '@/types/fitness'

export type RangeDays = 7 | 14 | 30

/** Days fetched per load: the visible range plus the same span before it for comparisons. */
const FETCH_DAYS = 60

let requestId = 0

export const useFitnessStore = defineStore('fitness', {
  state: () => ({
    today: todayIn() as ISODate,
    selectedDate: todayIn() as ISODate,
    rangeDays: 30 as RangeDays,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    /** Oldest first, ending at selectedDate. */
    days: [] as DaySummary[],
    status: null as DataStatus | null,
    goals: DEFAULT_GOALS as Goals,
    loading: false,
    loaded: false,
    error: null as string | null,
  }),
  getters: {
    selectedDay: (s): DaySummary | null => s.days.find((d) => d.date === s.selectedDate) ?? null,
    /** The visible range, oldest first. */
    rangeDaysList: (s): DaySummary[] => s.days.slice(-s.rangeDays),
    isToday: (s) => s.selectedDate === s.today,
  },
  actions: {
    async load() {
      const id = ++requestId
      const adapter = useModeStore().adapter
      this.loading = true
      this.error = null
      try {
        if (!this.loaded) {
          const [status, goals] = await Promise.all([adapter.getStatus(), adapter.getGoals()])
          if (id !== requestId) return
          this.status = status
          this.goals = goals
          this.timezone = status.timezone
          this.today = todayIn(status.timezone)
          if (this.selectedDate > this.today) this.selectedDate = this.today
        }
        const { days, timezone } = await adapter.getDays(addDays(this.selectedDate, 1 - FETCH_DAYS), this.selectedDate)
        if (id !== requestId) return
        this.days = days
        this.timezone = timezone
        this.loaded = true
      } catch (err) {
        if (id === requestId) this.error = errorMessage(err, 'Could not load your data.')
      } finally {
        if (id === requestId) this.loading = false
      }
    },

    ensureLoaded() {
      if (!this.loaded && !this.loading) return this.load()
    },

    selectDate(date: ISODate) {
      const clamped = date > this.today ? this.today : date
      if (clamped === this.selectedDate) return
      this.selectedDate = clamped
      const journal = useJournalStore()
      return Promise.all([this.load(), journal.loaded ? journal.load() : undefined])
    },

    setRange(days: RangeDays) {
      this.rangeDays = days
    },

    async refreshStatus() {
      try {
        this.status = await useModeStore().adapter.getStatus()
      } catch (err) {
        this.error = errorMessage(err, 'Could not load data status.')
      }
    },

    async saveGoals(goals: Goals) {
      this.goals = await useModeStore().adapter.saveGoals(goals)
    },
  },
})
