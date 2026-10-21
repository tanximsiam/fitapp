import type { Bar } from '@/components/charts/BarChart.vue'
import type { LinePoint } from '@/components/charts/LineChart.vue'
import { SLEEP_STAGES } from '@/components/sleepStages'
import { formatDuration, formatShortDate, formatWeekday } from '@/lib/format'
import type { DaySummary } from '@/types/fitness'

const dayTitle = (date: string) => `${formatWeekday(date)}, ${formatShortDate(date)}`
const axisLabel = (date: string, count: number) => (count <= 7 ? formatWeekday(date).slice(0, 2) : String(Number(date.slice(8))))

/** One bar per day for a single measured value. */
export function metricBars(days: DaySummary[], pick: (d: DaySummary) => number | null | undefined, color: string, format: (n: number) => string): Bar[] {
  return days.map((d) => {
    const v = pick(d)
    return {
      key: d.date,
      label: axisLabel(d.date, days.length),
      title: dayTitle(d.date),
      segments: v == null ? null : [{ value: v, color }],
      valueText: v == null ? 'No data' : format(v),
    }
  })
}

/** Nightly sleep in hours, stacked by stage when stages were reported. */
export function sleepBars(days: DaySummary[]): Bar[] {
  return days.map((d) => {
    const s = d.sleep
    const base = { key: d.date, label: axisLabel(d.date, days.length), title: `Night ending ${dayTitle(d.date)}` }
    if (!s) return { ...base, segments: null, valueText: 'No data' }
    const segments = s.stages
      ? [...SLEEP_STAGES]
          .reverse()
          .filter((st) => s.stages?.[st.key] != null)
          .map((st) => ({ value: (s.stages?.[st.key] ?? 0) / 60, color: st.color, name: st.label, valueText: formatDuration(s.stages?.[st.key]) }))
      : [{ value: s.durationMin / 60, color: 'var(--sleep)' }]
    return { ...base, segments, valueText: `${formatDuration(s.durationMin)} total` }
  })
}

export function dailyLine(days: DaySummary[], pick: (d: DaySummary) => number | null | undefined): LinePoint[] {
  return days.map((d, i) => ({ x: i, label: dayTitle(d.date), value: pick(d) ?? null }))
}

export function dailyTicks(days: DaySummary[]) {
  const every = Math.max(1, Math.ceil(days.length / 6))
  return days
    .map((d, i) => ({ value: i, label: formatShortDate(d.date) }))
    .filter((_, i) => (days.length - 1 - i) % every === 0)
}

/** A floating bar per day from the lowest to the highest value (a transparent base segment lifts it). */
export function rangeBars(
  days: DaySummary[],
  pick: (d: DaySummary) => { min: number; max: number } | null | undefined,
  color: string,
  format: (n: number) => string,
): Bar[] {
  return days.map((d) => {
    const r = pick(d)
    return {
      key: d.date,
      label: axisLabel(d.date, days.length),
      title: dayTitle(d.date),
      segments: r ? [{ value: r.min, color: 'transparent' }, { value: Math.max(0.5, r.max - r.min), color }] : null,
      valueText: r ? `${format(r.min)}–${format(r.max)}` : 'No data',
    }
  })
}

/** The last `n` values ending at the newest day, for small sparklines. */
export const lastValues = (days: DaySummary[], pick: (d: DaySummary) => number | null | undefined, n = 7) =>
  days.slice(-n).map((d) => pick(d) ?? null)
