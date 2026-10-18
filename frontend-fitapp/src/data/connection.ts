import type { DataStatus, Measurement } from '@/types/fitness'

export type SyncState = 'none' | 'current' | 'delayed' | 'stale'

/** Freshness of the last successful upload: under 2 h current, under 24 h delayed, otherwise stale. */
export function syncState(status: DataStatus | null, now = new Date()): SyncState {
  if (!status?.lastIngestedAt) return 'none'
  const hours = (now.getTime() - Date.parse(status.lastIngestedAt)) / 3600_000
  return hours < 2 ? 'current' : hours < 24 ? 'delayed' : 'stale'
}

export const SYNC_LABELS: Record<SyncState, string> = {
  none: 'No data received yet',
  current: 'Up to date',
  delayed: 'Sync delayed',
  stale: 'Not syncing',
}

export const MEASUREMENT_LABELS: Record<Measurement, string> = {
  steps: 'Steps',
  distance: 'Distance',
  active_energy: 'Active energy',
  active_minutes: 'Active time',
  workouts: 'Workouts',
  sleep: 'Sleep duration',
  sleep_stages: 'Sleep stages',
  sleep_score: 'Sleep score',
  heart_rate: 'Heart-rate readings',
  resting_heart_rate: 'Resting heart rate',
  stress: 'Stress (watch-estimated)',
  spo2: 'Blood oxygen (SpO₂)',
  skin_temperature: 'Skin temperature',
}

export const WORKOUT_LABELS: Record<string, string> = {
  running: 'Run',
  cycling: 'Ride',
  strength: 'Strength',
  walking: 'Walk',
  swimming: 'Swim',
}

export const workoutLabel = (type: string) => WORKOUT_LABELS[type] ?? type.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
