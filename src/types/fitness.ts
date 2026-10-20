/**
 * Frontend data contracts shared by the demo and backend adapters.
 * `null` always means "not measured"; it is never shown or summed as 0.
 */

/** Local calendar date, YYYY-MM-DD. */
export type ISODate = string

export interface ActivityDay {
  steps: number | null
  distanceM: number | null
  activeKcal: number | null
  activeMinutes: number | null
  source: string | null
}

export interface SleepStages {
  deepMin: number | null
  lightMin: number | null
  remMin: number | null
  awakeMin: number | null
}

export interface SleepNight {
  /** ISO 8601 instants with offset. */
  startAt: string
  endAt: string
  durationMin: number
  score: number | null
  stages: SleepStages | null
  source: string | null
}

export interface HeartRateDay {
  restingBpm: number | null
  minBpm: number | null
  maxBpm: number | null
  avgBpm: number | null
  sampleCount: number
  source: string | null
}

export interface Workout {
  type: string
  startAt: string
  endAt: string
  durationMin: number
  activeKcal: number | null
  distanceM: number | null
  avgBpm: number | null
  maxBpm: number | null
  source: string | null
}

/** Daily summary of a reading series (watch stress 0–100 or SpO₂ %). */
export interface SignalDay {
  avg: number
  min: number
  max: number
  sampleCount: number
  source: string | null
}

export interface SkinTemperatureDay {
  /** °C relative to the wearer's baseline, measured overnight. Not body temperature. */
  deviationC: number
  source: string | null
}

export type ReadingKind = 'stress' | 'spo2'

export interface Reading {
  at: string
  value: number
}

export interface DaySummary {
  date: ISODate
  activity: ActivityDay | null
  /** Main sleep that ended on this date. */
  sleep: SleepNight | null
  heartRate: HeartRateDay | null
  workouts: Workout[]
  /** Watch-estimated stress; unrelated to stress the user reports in mood check-ins. */
  stress: SignalDay | null
  spo2: SignalDay | null
  skinTemp: SkinTemperatureDay | null
}

/** Vocabulary shared with the ingestion contract. */
export const MEASUREMENTS = [
  'steps',
  'distance',
  'active_energy',
  'active_minutes',
  'workouts',
  'sleep',
  'sleep_stages',
  'sleep_score',
  'heart_rate',
  'resting_heart_rate',
  'stress',
  'spo2',
  'skin_temperature',
] as const
export type Measurement = (typeof MEASUREMENTS)[number]

export interface HeartRateSample {
  at: string
  bpm: number
}

export interface Goals {
  steps: number
  activeKcal: number
  distanceM: number
  sleepMin: number
}

export interface DataSourceStatus {
  key: string
  name: string
  device: string | null
  /** What the source declares it provides. */
  measurements: Measurement[]
  /** Kinds of data actually received. */
  received: string[]
  lastIngestedAt: string | null
  latestDate: ISODate | null
}

export interface DataStatus {
  sources: DataSourceStatus[]
  lastIngestedAt: string | null
  latestDate: ISODate | null
  /** Latest uploaded reading, not a live value. */
  latestHeartRate: { at: string; bpm: number; source: string | null } | null
  timezone: string
}

export interface DaysResult {
  days: DaySummary[]
  timezone: string
}

/** Interchangeable data source for the UI: browser demo or the FitApp backend. */
export interface FitnessAdapter {
  readonly kind: 'demo' | 'backend'
  getDays(from: ISODate, to: ISODate): Promise<DaysResult>
  getHeartRate(date: ISODate): Promise<HeartRateSample[]>
  getReadings(kind: ReadingKind, date: ISODate): Promise<Reading[]>
  getStatus(): Promise<DataStatus>
  getGoals(): Promise<Goals>
  saveGoals(goals: Goals): Promise<Goals>
}

/* Backend payloads (snake_case), see docs/openapi.yaml. */

export interface SignalPayload {
  avg: number
  min: number
  max: number
  sample_count: number
  source: string
}

export interface DaySummaryPayload {
  date: string
  activity: { steps: number | null; distance_m: number | null; active_kcal: number | null; active_minutes: number | null; source: string } | null
  sleep: {
    start_at: string
    end_at: string
    duration_min: number
    score: number | null
    stages: { deep_min: number | null; light_min: number | null; rem_min: number | null; awake_min: number | null } | null
    source: string
  } | null
  heart_rate: {
    resting_bpm: number | null
    min_bpm: number | null
    max_bpm: number | null
    avg_bpm: number | null
    sample_count: number
    source: string
  } | null
  stress?: SignalPayload | null
  spo2?: SignalPayload | null
  skin_temperature?: { deviation_c: number; source: string } | null
  workouts?: {
    type: string
    start_at: string
    end_at: string
    duration_min: number
    active_kcal: number | null
    distance_m: number | null
    avg_bpm: number | null
    max_bpm: number | null
    source: string
  }[]
}

export interface GoalsPayload {
  steps: number
  active_kcal: number
  distance_m: number
  sleep_min: number
}

export interface StatusPayload {
  sources: {
    key: string
    name: string
    device: string | null
    measurements: Measurement[]
    received?: string[]
    last_ingested_at: string | null
    latest_date?: string | null
  }[]
  last_ingested_at: string | null
  latest_date: string | null
  latest_heart_rate: { at: string; bpm: number; source: string | null } | null
  timezone: string
}

export interface IngestToken {
  id: number
  name: string
  lastUsedAt: string | null
  createdAt: string | null
}
