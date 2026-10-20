import { addDays, daysBetween } from '@/lib/dates'
import { mean } from './derive'
import type { ISODate } from '@/types/fitness'
import type { CycleDay } from '@/types/journal'

export interface Period {
  start: ISODate
  end: ISODate
  lengthDays: number
  days: CycleDay[]
}

export interface Cycle {
  start: ISODate
  /** Start of the following period; the cycle is complete only when this is known. */
  nextStart: ISODate
  lengthDays: number
  period: Period
}

/**
 * Periods are runs of recorded bleeding. A run starts on a day with light, medium or heavy flow;
 * spotting joins an adjacent run but never starts one, and a single day without a record inside a
 * run (gap of one day) does not split it.
 */
export function derivePeriods(cycleDays: CycleDay[]): Period[] {
  const bleeding = cycleDays.filter((d) => d.flow !== null).sort((a, b) => a.date.localeCompare(b.date))
  const periods: Period[] = []
  for (const day of bleeding) {
    const last = periods.at(-1)
    if (last && daysBetween(last.end, day.date) <= 2) {
      last.end = day.date
      last.days.push(day)
    } else if (day.flow !== 'spotting') {
      periods.push({ start: day.date, end: day.date, lengthDays: 0, days: [day] })
    }
  }
  for (const p of periods) p.lengthDays = daysBetween(p.start, p.end) + 1
  return periods
}

/** Completed cycles only: from one observed period start to the next. Nothing is assumed or predicted. */
export function deriveCycles(periods: Period[]): Cycle[] {
  return periods.slice(0, -1).map((p, i) => ({
    start: p.start,
    nextStart: periods[i + 1].start,
    lengthDays: daysBetween(p.start, periods[i + 1].start),
    period: p,
  }))
}

export function cycleSummary(cycles: Cycle[], periods: Period[]) {
  const lengths = cycles.map((c) => c.lengthDays)
  return {
    completedCycles: cycles.length,
    recordedPeriods: periods.length,
    avgCycleDays: mean(lengths),
    shortestCycleDays: lengths.length ? Math.min(...lengths) : null,
    longestCycleDays: lengths.length ? Math.max(...lengths) : null,
    avgPeriodDays: mean(periods.map((p) => p.lengthDays)),
  }
}

/** Day number within the period (1-based) for a date, or null when the date is not in that period. */
export function periodDayIndex(period: Period, date: ISODate): number | null {
  const n = daysBetween(period.start, date)
  return n >= 0 && date <= period.end ? n + 1 : null
}

export const nextDay = (d: ISODate) => addDays(d, 1)
