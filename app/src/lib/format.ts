import type { ISODate } from '@/types/fitness'

const int = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const oneDecimal = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export const EMPTY = '—'

export function formatInt(n: number | null | undefined): string {
  return n == null ? EMPTY : int.format(n)
}

export function formatKm(metres: number | null | undefined): string {
  return metres == null ? EMPTY : `${oneDecimal.format(metres / 1000)} km`
}

export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null) return EMPTY
  const m = Math.round(minutes)
  const h = Math.floor(m / 60)
  return h ? `${h}h ${String(m % 60).padStart(2, '0')}m` : `${m}m`
}

/** Clock time as recorded by the source ("07:06"), independent of the viewer's timezone. */
export function formatClock(iso: string): string {
  return iso.slice(11, 16)
}

const dateFmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...opts })
const longDate = dateFmt({ weekday: 'long', month: 'long', day: 'numeric' })
const shortDate = dateFmt({ month: 'short', day: 'numeric' })
const weekdayShort = dateFmt({ weekday: 'short' })

const asUtc = (date: ISODate) => new Date(`${date}T00:00:00Z`)

export const formatLongDate = (date: ISODate) => longDate.format(asUtc(date))
export const formatShortDate = (date: ISODate) => shortDate.format(asUtc(date))
export const formatWeekday = (date: ISODate) => weekdayShort.format(asUtc(date))

export function formatRelative(iso: string | null, now = new Date()): string {
  if (!iso) return 'never'
  const minutes = Math.round((now.getTime() - Date.parse(iso)) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours} h ago`
  return `${Math.round(hours / 24)} days ago`
}

export function formatPercentChange(pct: number | null): string {
  if (pct == null) return EMPTY
  const rounded = Math.round(pct)
  return rounded === 0 ? 'no change' : `${rounded > 0 ? '+' : '−'}${Math.abs(rounded)}%`
}
