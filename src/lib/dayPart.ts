/** Parts of the day for the greeting and the mood question: morning 5–12, afternoon 12–17, evening 17–22, night 22–5. */
export type DayPartKey = 'morning' | 'afternoon' | 'evening' | 'night'

export interface DayPart {
  key: DayPartKey
  greeting: string
  /** Used in "How are you feeling …?" */
  phrase: string
  /** When this part began (night may have begun yesterday at 22:00). */
  start: Date
}

export function dayPart(now = new Date()): DayPart {
  const h = now.getHours()
  const at = (hour: number, dayOffset = 0) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hour)
  if (h >= 5 && h < 12) return { key: 'morning', greeting: 'Good morning', phrase: 'this morning', start: at(5) }
  if (h >= 12 && h < 17) return { key: 'afternoon', greeting: 'Good afternoon', phrase: 'this afternoon', start: at(12) }
  if (h >= 17 && h < 22) return { key: 'evening', greeting: 'Good evening', phrase: 'this evening', start: at(17) }
  return { key: 'night', greeting: 'Good night', phrase: 'tonight', start: h >= 22 ? at(22) : at(22, -1) }
}
