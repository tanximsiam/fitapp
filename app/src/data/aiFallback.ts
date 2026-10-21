import type { SavedEntry } from '@/data/aiPayload'
import type { HealthScore } from '@/data/healthScore'

/** Wording used when the AI service is off, offline or showing sample data. */

export function fallbackTip(s: HealthScore): string {
  if (s.focus === 'activity' && s.activityMinutes != null) {
    const left = Math.max(10, Math.ceil((150 - s.activityMinutes) / 10) * 10)
    return `Add ${left} active minutes this week, a brisk walk counts.`
  }
  if (s.focus === 'sleep' && s.sleepHours != null) {
    return s.sleepHours < 7 ? 'Aim for 7 to 9 hours of sleep: try going to bed 30 minutes earlier.' : 'Keep sleep under 9 hours with a steady wake-up time.'
  }
  return 'Keep it up: your activity and sleep are right where they should be.'
}

export function fallbackFeedback(e: SavedEntry): string {
  switch (e.kind) {
    case 'mood':
      return e.input.mood <= 2 ? 'Thanks for checking in on a hard moment. A short walk or a glass of water can help a little.' : 'Noted. A few check-ins a day show how sleep and activity shape your mood.'
    case 'meal':
      return 'Logged. Meals with some protein and vegetables keep energy steadier through the day.'
    case 'drink':
      return `${e.input.volumeMl} ml added. Small, regular drinks are easier than catching up later.`
    case 'activity':
      return e.input.durationMin >= 30 ? 'Great session. Drink some water and give tired muscles a stretch.' : 'Every bit of movement counts toward your weekly 150 minutes.'
  }
}
