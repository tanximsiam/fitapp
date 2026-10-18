import * as fitnessApi from '@/api/fitness'
import { dateRange } from '@/lib/dates'
import { DEMO_SOURCE, clockFrom, generateDay } from './demo'
import type { FitnessAdapter, Goals } from '@/types/fitness'

export const DEFAULT_GOALS: Goals = { steps: 8000, activeKcal: 450, distanceM: 6000, sleepMin: 450 }

const DEMO_GOALS_KEY = 'fitapp.demo.goals'

/** Browser-only sample data. Never touches the network. */
export function createDemoAdapter(now: () => Date = () => new Date()): FitnessAdapter {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  return {
    kind: 'demo',
    async getDays(from, to) {
      const clock = clockFrom(now())
      return { days: dateRange(from, to).map((d) => generateDay(d, clock).summary), timezone }
    },
    async getHeartRate(date) {
      return generateDay(date, clockFrom(now())).samples
    },
    async getStatus() {
      const current = now()
      // The demo "syncs" every 15 minutes.
      const synced = new Date(Math.floor(current.getTime() / 900_000) * 900_000).toISOString()
      return {
        sources: [{ key: DEMO_SOURCE, name: 'Generated sample data', lastIngestedAt: synced, latestDate: clockFrom(current).today }],
        lastIngestedAt: synced,
        latestDate: clockFrom(current).today,
        timezone,
      }
    },
    async getGoals() {
      try {
        const stored = JSON.parse(localStorage.getItem(DEMO_GOALS_KEY) ?? 'null')
        return stored ? { ...DEFAULT_GOALS, ...stored } : DEFAULT_GOALS
      } catch {
        return DEFAULT_GOALS
      }
    },
    async saveGoals(goals) {
      localStorage.setItem(DEMO_GOALS_KEY, JSON.stringify(goals))
      return goals
    },
  }
}

/** FitApp's own Laravel API. Errors propagate; there is no fallback to sample data. */
export function createBackendAdapter(): FitnessAdapter {
  return {
    kind: 'backend',
    getDays: fitnessApi.getDays,
    getHeartRate: fitnessApi.getHeartRate,
    getStatus: fitnessApi.getStatus,
    getGoals: fitnessApi.getGoals,
    saveGoals: fitnessApi.saveGoals,
  }
}
