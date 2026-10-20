import type { ISODate } from '@/types/fitness'

const DAY_MS = 86_400_000

/** Today's local date in the given IANA zone (browser zone when omitted). */
export function todayIn(timeZone?: string, now = new Date()): ISODate {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

/** Calendar arithmetic on YYYY-MM-DD strings, independent of the browser's timezone. */
export function addDays(date: ISODate, days: number): ISODate {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10)
}

export function daysBetween(from: ISODate, to: ISODate): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS)
}

export function dateRange(from: ISODate, to: ISODate): ISODate[] {
  const n = daysBetween(from, to)
  return Array.from({ length: Math.max(0, n + 1) }, (_, i) => addDays(from, i))
}

/** 0 = Sunday … 6 = Saturday. */
export function weekday(date: ISODate): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay()
}

/** Minutes since local midnight, read from an ISO string's own wall-clock time (keeps the source's timezone). */
export function wallMinutes(iso: string): number {
  const [h, m] = iso.slice(11, 16).split(':').map(Number)
  return h * 60 + m
}

/** "+06:00" style offset for a JS timezone offset in minutes (Date#getTimezoneOffset sign convention). */
export function offsetString(tzOffsetMin: number): string {
  const total = -tzOffsetMin
  const sign = total >= 0 ? '+' : '-'
  const abs = Math.abs(total)
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
}
