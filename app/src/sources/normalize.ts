import type { ISODate, Measurement } from '@/types/fitness'
import type { SourceRecords } from '@/types/ingest'
import type { SourceId } from './types'

/**
 * Pure conversions from health-platform results to the ingest contract, kept apart from the plugins
 * so they can be unit-tested without a phone.
 */

const pad = (n: number) => String(n).padStart(2, '0')

/** Local calendar date of a platform timestamp. Android day buckets come without an offset (already local); iOS sends instants. */
export function localDate(s: string): ISODate {
  if (!/(Z|[+-]\d{2}:?\d{2})$/.test(s)) return s.slice(0, 10)
  const d = new Date(s)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** An instant the backend accepts (offset or Z required); a local time without offset is read as this phone's time. */
export const instant = (s: string) => new Date(s).toISOString()

const WORKOUT_ALIASES: Record<string, string> = { biking: 'cycling', bike: 'cycling', strength_training: 'strength', traditional_strength_training: 'strength', swimming_pool: 'swimming', swimming_open_water: 'swimming' }

/** Platform workout names ("RUNNING", "traditionalStrengthTraining") to the ingest vocabulary ("running", "strength"). */
export function workoutType(raw: string | undefined): string {
  const snake = (raw ?? 'other')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[^a-z]+/g, '_')
    .replace(/^_+|_+$/g, '')
  const t = WORKOUT_ALIASES[snake] ?? snake
  return /^[a-z][a-z_]{1,31}$/.test(t) ? t : 'other'
}

export interface PlatformDay {
  startDate: string
  value: number
}
export interface PlatformWorkout {
  startDate: string
  endDate: string
  workoutType?: string
  calories?: number
  distance?: number
  heartRate?: { timestamp: string; bpm: number }[]
}

const bpmOk = (n: number) => Number.isFinite(n) && n >= 20 && n <= 250

/**
 * Health Connect / Apple Health results to ingest records, for the measurements this source is assigned.
 * Day totals come from the platform's own aggregation, which already de-duplicates phone and watch.
 */
export function platformRecords(
  data: { steps?: PlatformDay[]; activeKcal?: PlatformDay[]; workouts?: PlatformWorkout[] },
  only: Measurement[],
): SourceRecords {
  const out: SourceRecords = {}
  const days = new Map<ISODate, { date: ISODate; steps?: number; active_kcal?: number }>()
  const day = (date: ISODate) => days.get(date) ?? days.set(date, { date }).get(date)!
  if (only.includes('steps')) for (const s of data.steps ?? []) day(localDate(s.startDate)).steps = Math.round(s.value)
  if (only.includes('active_energy')) for (const s of data.activeKcal ?? []) day(localDate(s.startDate)).active_kcal = Math.round(s.value)
  // A day the platform reports as 0 with nothing else recorded is "no data", not a measured zero.
  const activity = [...days.values()].filter((d) => (d.steps ?? 0) > 0 || (d.active_kcal ?? 0) > 0)
  if (activity.length) out.activity = activity.sort((a, b) => a.date.localeCompare(b.date))

  if (only.includes('workouts') && data.workouts?.length) {
    out.workouts = data.workouts
      .filter((w) => Date.parse(w.endDate) > Date.parse(w.startDate) && Date.parse(w.endDate) - Date.parse(w.startDate) <= 86_400_000)
      .map((w) => {
        const bpm = (w.heartRate ?? []).map((h) => h.bpm).filter(bpmOk)
        return {
          date: localDate(w.startDate),
          type: workoutType(w.workoutType),
          start_at: instant(w.startDate),
          end_at: instant(w.endDate),
          active_kcal: w.calories != null && w.calories > 0 ? Math.round(w.calories) : null,
          distance_m: w.distance != null && w.distance > 0 ? Math.round(w.distance) : null,
          avg_bpm: bpm.length ? Math.round(bpm.reduce((a, b) => a + b, 0) / bpm.length) : null,
          max_bpm: bpm.length ? Math.max(...bpm) : null,
        }
      })
  }

  // Heart-rate readings this source can give are the ones recorded during workouts.
  if (only.includes('heart_rate')) {
    const samples = (data.workouts ?? []).flatMap((w) => w.heartRate ?? []).filter((h) => bpmOk(h.bpm))
    if (samples.length) out.heart_rate = { samples: samples.slice(0, 10_000).map((h) => ({ at: instant(h.timestamp), bpm: Math.round(h.bpm) })) }
  }
  return out
}

/**
 * Gives each measurement to exactly one connected source, in priority order (the list order),
 * so two sources never upload the same steps or heart rate for the same day.
 */
export function assignMeasurements(sources: { id: SourceId; granted: Measurement[] }[]): Record<string, Measurement[]> {
  const taken = new Set<Measurement>()
  const out: Record<string, Measurement[]> = {}
  for (const s of sources) {
    out[s.id] = s.granted.filter((m) => !taken.has(m))
    out[s.id].forEach((m) => taken.add(m))
  }
  return out
}
