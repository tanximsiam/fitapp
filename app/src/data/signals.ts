import type { Reading } from '@/types/fitness'

/** Zones commonly used by watches for a 0–100 stress estimate. Labels describe the scale, not health. */
export const STRESS_ZONES = [
  { key: 'relaxed', label: 'Relaxed', min: 0, max: 39, color: 'var(--zone-1)' },
  { key: 'normal', label: 'Normal', min: 40, max: 59, color: 'var(--zone-2)' },
  { key: 'medium', label: 'Medium', min: 60, max: 79, color: 'var(--zone-3)' },
  { key: 'high', label: 'High', min: 80, max: 100, color: 'var(--zone-4)' },
] as const

/** Share of readings in each zone (readings, not minutes: intervals between readings can vary). */
export function zoneShares(readings: Reading[]) {
  const total = readings.length
  return STRESS_ZONES.map((z) => {
    const count = readings.filter((r) => r.value >= z.min && r.value <= z.max).length
    return { ...z, count, share: total ? count / total : 0 }
  })
}

export const formatDeviation = (c: number | null | undefined) =>
  c == null ? '—' : `${c > 0 ? '+' : c < 0 ? '−' : '±'}${Math.abs(c).toFixed(2)} °C`
