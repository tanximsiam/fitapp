import type { AiCoach } from '@/api/ai'
import type { SavedEntry } from '@/data/aiPayload'
import { STEP_TARGET, type HealthScore, type ScorePart } from '@/data/healthScore'
import { formatInt } from '@/lib/format'

/** Wording used when the AI service cannot be asked (offline, no server, or it is switched off). */

const TIPS: Record<ScorePart, (value: number) => string> = {
  activity: (min) => `Add ${Math.max(10, Math.ceil((150 - min) / 10) * 10)} active minutes this week; a brisk walk counts.`,
  steps: (steps) => `Aim for ${formatInt(STEP_TARGET)} steps a day, about ${formatInt(Math.max(500, Math.ceil((STEP_TARGET - steps) / 500) * 500))} more than now.`,
  sleep: (h) => (h < 7 ? 'Get to bed 30 minutes earlier to reach 7 to 9 hours.' : 'Keep sleep under 9 hours with a steady wake-up time.'),
  regularity: () => 'Go to bed and wake up at the same times, weekends included.',
  heart: () => 'Regular walks and steady sleep help bring your resting heart rate down.',
  hydration: () => 'Spread your water through the day to reach your goal.',
}

const STRENGTHS: Record<ScorePart, string> = {
  activity: 'You moved plenty this week',
  steps: 'Your daily steps were on target',
  sleep: 'You slept 7 to 9 hours',
  regularity: 'Your sleep times were steady',
  heart: 'Your resting heart rate stayed low',
  hydration: 'You kept up with water',
}

export function fallbackCoach(s: HealthScore): AiCoach {
  const best = [...s.parts].sort((a, b) => b.points - a.points)[0]
  const weak = s.parts.find((p) => p.part === s.focus)
  return {
    summary: `${s.label} week. ${STRENGTHS[best.part]}.`,
    tip: weak ? TIPS[weak.part](weak.value) : 'Keep it up: everything is where it should be.',
  }
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
