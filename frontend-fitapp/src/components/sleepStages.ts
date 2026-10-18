import type { SleepStages } from '@/types/fitness'

/** Ordinal ramp, shallow to deep (validated light and dark). */
export const SLEEP_STAGES: { key: keyof SleepStages; label: string; color: string }[] = [
  { key: 'awakeMin', label: 'Awake', color: 'var(--stage-awake)' },
  { key: 'remMin', label: 'REM', color: 'var(--stage-rem)' },
  { key: 'lightMin', label: 'Light', color: 'var(--stage-light)' },
  { key: 'deepMin', label: 'Deep', color: 'var(--stage-deep)' },
]
