import * as fitnessApi from '@/api/fitness'
import { dateRange } from '@/lib/dates'
import { DEMO_DEVICE, DEMO_MEASUREMENTS, DEMO_SOURCE, clockFrom, generateDay } from './demo'
import type { FitnessAdapter, Goals } from '@/types/fitness'

export const DEFAULT_GOALS: Goals = { steps: 8000, activeKcal: 450, distanceM: 6000, sleepMin: 450 }

const DEMO_GOALS_KEY = 'fitapp.demo.goals'
const DEMO_SCENARIO_KEY = 'fitapp.demo.scenario'
const DEMO_SYNC_KEY = 'fitapp.demo.syncedAt'

/** Simulated connection states the demo can show. None of them involve a real device. */
export type DemoScenario = 'synced' | 'delayed' | 'offline'

export const demoControls = {
  scenario(): DemoScenario {
    const s = localStorage.getItem(DEMO_SCENARIO_KEY)
    return s === 'delayed' || s === 'offline' ? s : 'synced'
  },
  setScenario(s: DemoScenario) {
    localStorage.setItem(DEMO_SCENARIO_KEY, s)
    localStorage.removeItem(DEMO_SYNC_KEY)
  },
  /** "Sync now": marks the simulated watch as synced at this moment. */
  syncNow(now = new Date()) {
    localStorage.setItem(DEMO_SCENARIO_KEY, 'synced')
    localStorage.setItem(DEMO_SYNC_KEY, now.toISOString())
  },
  reset() {
    for (const key of [DEMO_GOALS_KEY, DEMO_SCENARIO_KEY, DEMO_SYNC_KEY]) localStorage.removeItem(key)
  },
}

/** When the simulated watch last delivered data; everything after it is not there yet. */
export function demoSyncTime(now: Date, scenario = demoControls.scenario()): Date {
  if (scenario === 'delayed') return new Date(now.getTime() - 9 * 3600_000)
  if (scenario === 'offline') {
    const t = new Date(now)
    t.setDate(t.getDate() - 2)
    t.setHours(21, 40, 0, 0)
    return t
  }
  const manual = localStorage.getItem(DEMO_SYNC_KEY)
  // Regular background sync every 15 minutes, or the moment of the last "Sync now".
  const regular = Math.floor(now.getTime() / 900_000) * 900_000
  return new Date(Math.max(regular, manual ? Date.parse(manual) : 0))
}

/** Browser-only sample data. Never touches the network. */
export function createDemoAdapter(now: () => Date = () => new Date()): FitnessAdapter {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const syncedClock = () => clockFrom(demoSyncTime(now()))

  return {
    kind: 'demo',
    async getDays(from, to) {
      const clock = syncedClock()
      return { days: dateRange(from, to).map((d) => generateDay(d, clock).summary), timezone }
    },
    async getHeartRate(date) {
      return generateDay(date, syncedClock()).samples
    },
    async getStatus() {
      const synced = demoSyncTime(now())
      const clock = clockFrom(synced)
      // Latest reading: the last sample before the sync (looking back a day if the watch was off-wrist).
      const latest = generateDay(clock.today, clock).samples.at(-1) ?? null
      return {
        sources: [
          {
            key: DEMO_SOURCE,
            name: 'FitApp demo',
            device: DEMO_DEVICE,
            measurements: DEMO_MEASUREMENTS,
            received: ['activity', 'workouts', 'sleep', 'resting_heart_rate', 'heart_rate'],
            lastIngestedAt: synced.toISOString(),
            latestDate: clock.today,
          },
        ],
        lastIngestedAt: synced.toISOString(),
        latestDate: clock.today,
        latestHeartRate: latest && { ...latest, source: DEMO_SOURCE },
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
