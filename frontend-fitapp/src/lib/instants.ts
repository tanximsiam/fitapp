import { offsetString } from './dates'

/** "2026-10-18T13:05" (datetime-local) → ISO with this browser's offset for that moment. */
export function localInputToIso(value: string): string {
  const d = new Date(value)
  return `${value.slice(0, 16)}:00${offsetString(d.getTimezoneOffset())}`
}

/** ISO with offset → "YYYY-MM-DDTHH:MM" showing the wall time it was recorded at. */
export const isoToLocalInput = (iso: string) => iso.slice(0, 16)

/** Default time for a new entry on `date`: now if it is today, otherwise noon. */
export function defaultInputFor(date: string, now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  return date === today ? `${date}T${pad(now.getHours())}:${pad(now.getMinutes())}` : `${date}T12:00`
}
