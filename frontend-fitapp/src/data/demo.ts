import { addDays, daysBetween, offsetString, wallMinutes, weekday } from '@/lib/dates'
import { summarizeHeartRate } from './derive'
import { MEASUREMENTS, type DaySummary, type HeartRateSample, type ISODate, type Workout } from '@/types/fitness'

/**
 * Deterministic sample data. Each calendar date has its own seed, so a date always produces the same
 * values; only "today" is cut off at the current time. Summaries are derived from the generated
 * samples and stages, so totals and charts agree with each other.
 */

export const DEMO_WINDOW_DAYS = 30
export const DEMO_SOURCE = 'demo'
export const DEMO_DEVICE = 'Simulated watch'
/** The simulated watch provides everything the ingestion contract supports. */
export const DEMO_MEASUREMENTS = [...MEASUREMENTS]
const WORKOUT_TYPES = ['running', 'strength', 'cycling'] as const

export interface DemoClock {
  today: ISODate
  /** Minutes since local midnight. */
  nowMinutes: number
  /** "+06:00" style offset used for generated instants. */
  offset: string
}

export function clockFrom(now: Date): DemoClock {
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    today: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    nowMinutes: now.getHours() * 60 + now.getMinutes(),
    // shortcut: one offset for the whole window, so a DST change inside the 30 days shifts times by an hour.
    offset: offsetString(now.getTimezoneOffset()),
  }
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const dayNumber = (date: ISODate) => daysBetween('2020-01-01', date)
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Instant `rel` minutes after local midnight of `date` (negative = previous evening). */
function instant(date: ISODate, rel: number, offset: string): string {
  const shift = Math.floor(rel / 1440)
  const wall = rel - shift * 1440
  const hh = String(Math.floor(wall / 60)).padStart(2, '0')
  const mm = String(wall % 60).padStart(2, '0')
  return `${addDays(date, shift)}T${hh}:${mm}:00${offset}`
}

function profile(date: ISODate) {
  const n = dayNumber(date)
  const r = mulberry32(n * 7919 + 17)
  const dow = weekday(date)
  const weekend = dow === 0 || dow === 6
  const workout = dow === 1 || dow === 3 || dow === 6 || r() < 0.12
  // Sleep that ends on this date, in minutes relative to its midnight.
  const sleepStart = -120 + Math.round(25 + r() * 95 + (weekend ? 35 : 0))
  const sleepDuration = Math.round(355 + r() * 135)
  return {
    n,
    r,
    workout,
    weekend,
    sleepStart,
    sleepEnd: sleepStart + sleepDuration,
    restingBpm: Math.round(54 + r() * 5 + (sleepDuration < 390 ? 2 : 0)),
    // Gaps a real wearable produces: a night it was not worn, a day without heart data, a missing metric.
    noSleep: n % 11 === 4,
    noHeart: n % 13 === 6,
    noActiveMinutes: n % 17 === 3,
  }
}

export interface DemoDay {
  summary: DaySummary
  samples: HeartRateSample[]
}

export function generateDay(date: ISODate, clock: DemoClock): DemoDay {
  const age = daysBetween(date, clock.today)
  const empty = { summary: { date, activity: null, sleep: null, heartRate: null, workouts: [] }, samples: [] }
  if (age < 0 || age >= DEMO_WINDOW_DAYS) return empty

  const p = profile(date)
  const r = p.r
  const isToday = age === 0
  const endMinute = isToday ? clock.nowMinutes : 1440

  // Activity: cumulative totals so far today, full totals for past days.
  const elapsed = isToday ? clamp((clock.nowMinutes - 6 * 60) / (16 * 60), 0, 1) : 1
  const fullSteps = Math.round(clamp((p.weekend ? 6800 : 8400) + (r() - 0.5) * 4200 + (p.workout ? 3600 : 0), 1900, 19000))
  const steps = Math.round(fullSteps * elapsed)
  const workoutDone = p.workout && endMinute >= 19 * 60
  const activity = {
    steps,
    distanceM: Math.round(steps * (0.74 + r() * 0.04)),
    activeKcal: Math.round(steps * 0.04 + (workoutDone ? 210 : 0)),
    activeMinutes: p.noActiveMinutes ? null : Math.round(steps / 120 + (workoutDone ? 42 : 0)),
    source: DEMO_SOURCE,
  }

  // Sleep ending this morning; absent if not worn or not over yet.
  let sleep: DaySummary['sleep'] = null
  if (!p.noSleep && !(isToday && p.sleepEnd > clock.nowMinutes)) {
    const duration = p.sleepEnd - p.sleepStart
    const awakeMin = Math.round(12 + r() * 30)
    const deepMin = Math.round(duration * (0.13 + r() * 0.08))
    const remMin = Math.round(duration * (0.18 + r() * 0.06))
    const lightMin = duration - awakeMin - deepMin - remMin
    sleep = {
      startAt: instant(date, p.sleepStart, clock.offset),
      endAt: instant(date, p.sleepEnd, clock.offset),
      durationMin: duration,
      // Mimics a device-reported score; the UI only displays it.
      score: Math.round(clamp(38 + (Math.min(duration, 480) / 480) * 38 + (deepMin / duration) * 90 - awakeMin / 3, 0, 100)),
      stages: { deepMin, lightMin, remMin, awakeMin },
      source: DEMO_SOURCE,
    }
  }

  // Heart rate every 5 minutes while worn.
  const samples: HeartRateSample[] = []
  if (!p.noHeart) {
    const nextNightStart = profile(addDays(date, 1)).sleepStart + 1440
    const lastNightWorn = !p.noSleep
    for (let m = 0; m < endMinute; m += 5) {
      const asleep = m < p.sleepEnd || m >= nextNightStart
      if (asleep && m < p.sleepEnd && !lastNightWorn) continue
      let bpm: number
      if (asleep) bpm = p.restingBpm - 3 + r() * 5
      else if (p.workout && m >= 18 * 60 + 10 && m < 19 * 60) bpm = 128 + r() * 24
      else bpm = p.restingBpm + 14 + r() * 12 + (r() < 0.1 ? 22 + r() * 12 : 0)
      samples.push({ at: instant(date, m, clock.offset), bpm: Math.round(bpm) })
    }
  }

  const heartRate = samples.length ? { restingBpm: p.restingBpm, ...summarizeHeartRate(samples), source: DEMO_SOURCE } : null

  // The evening session behind the workout-day bump in steps, energy and heart rate.
  const workouts: Workout[] = []
  if (workoutDone) {
    const start = 18 * 60 + 10
    const end = 19 * 60
    const type = WORKOUT_TYPES[p.n % WORKOUT_TYPES.length]
    const during = summarizeHeartRate(samples.filter((s) => wallMinutes(s.at) >= start && wallMinutes(s.at) < end))
    workouts.push({
      type,
      startAt: instant(date, start, clock.offset),
      endAt: instant(date, end, clock.offset),
      durationMin: end - start,
      activeKcal: 210,
      distanceM: type === 'running' ? 5000 + (p.n % 7) * 300 : type === 'cycling' ? 14000 + (p.n % 5) * 1200 : null,
      avgBpm: during.avgBpm,
      maxBpm: during.maxBpm,
      source: DEMO_SOURCE,
    })
  }

  return { summary: { date, activity, sleep, heartRate, workouts }, samples }
}
