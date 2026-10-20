import type { DaySummary, HeartRateSample } from '@/types/fitness'

/** Mean of the measured values; null when nothing was measured (never treats gaps as 0). */
export function mean(values: (number | null | undefined)[]): number | null {
  const measured = values.filter((v): v is number => v != null)
  return measured.length ? measured.reduce((a, b) => a + b, 0) / measured.length : null
}

export function summarizeHeartRate(samples: HeartRateSample[]) {
  if (!samples.length) return { minBpm: null, maxBpm: null, avgBpm: null, sampleCount: 0 }
  const bpm = samples.map((s) => s.bpm)
  return {
    minBpm: Math.min(...bpm),
    maxBpm: Math.max(...bpm),
    avgBpm: Math.round(bpm.reduce((a, b) => a + b, 0) / bpm.length),
    sampleCount: bpm.length,
  }
}

/** Rounded mean, min, max and count of a reading series; null when there are no readings. */
export function summarizeValues(values: number[]) {
  if (!values.length) return null
  return {
    avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    min: Math.min(...values),
    max: Math.max(...values),
    sampleCount: values.length,
  }
}

/**
 * Compares the mean of the last `period` days with the `period` days before.
 * `days` must be ordered oldest first and end at the reference date.
 */
export function trend(days: DaySummary[], pick: (d: DaySummary) => number | null | undefined, period = 7) {
  const current = mean(days.slice(-period).map(pick))
  const previous = mean(days.slice(-2 * period, -period).map(pick))
  const changePct = current != null && previous ? ((current - previous) / previous) * 100 : null
  return { current, previous, changePct }
}

/** Share of the goal reached, 0–1+; null when not measured. */
export function progress(value: number | null | undefined, goal: number): number | null {
  return value == null || goal <= 0 ? null : value / goal
}

export function countMeasured(days: DaySummary[], pick: (d: DaySummary) => number | null | undefined): number {
  return days.filter((d) => pick(d) != null).length
}
