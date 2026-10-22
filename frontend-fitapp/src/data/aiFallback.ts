import type { AiCoach, AiInsight } from '@/api/ai'
import type { insightsPayload, SavedEntry } from '@/data/aiPayload'
import { mean } from '@/data/derive'
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

type DayNumbers = ReturnType<typeof insightsPayload>['days'][number]

/** Average of a value on the days that pass `test` and on the days that fail it; null without two of each. */
function split(days: DayNumbers[], value: (d: DayNumbers) => number | null, test: (d: DayNumbers) => boolean | null) {
  const pairs = days.map((d) => ({ v: value(d), t: test(d) })).filter((p): p is { v: number; t: boolean } => p.v != null && p.t != null)
  const avg = (list: number[]) => (list.length ? Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 10) / 10 : null)
  const yes = pairs.filter((p) => p.t).map((p) => p.v)
  const no = pairs.filter((p) => !p.t).map((p) => p.v)
  return yes.length >= 2 && no.length >= 2 ? { yes: avg(yes)!, no: avg(no)!, n: yes.length } : null
}

/**
 * Insights written from the same numbers the AI service would see, when it cannot be asked.
 * Each compares the person's own days with and without a habit, and is left out without enough days.
 */
export function fallbackInsights(p: ReturnType<typeof insightsPayload>): AiInsight[] {
  const out: AiInsight[] = []
  const sleep = split(p.days, (d) => d.energy, (d) => (d.sleep_hours == null ? null : d.sleep_hours >= 7))
  if (sleep && Math.abs(sleep.yes - sleep.no) >= 0.3) {
    out.push({
      area: 'sleep',
      title: sleep.yes > sleep.no ? 'Longer nights, more energy' : 'Energy and sleep length',
      body: `After the ${sleep.n} nights of 7 hours or more, your energy averaged ${sleep.yes} of 5, against ${sleep.no} after shorter nights.`,
      action: 'Aim for 7 hours tonight; a set bedtime makes it easier.',
    })
  }
  const steps = split(p.days, (d) => d.stress, (d) => (d.steps == null ? null : d.steps >= p.goals.steps))
  if (steps && Math.abs(steps.yes - steps.no) >= 2) {
    out.push({
      area: 'stress',
      title: steps.yes < steps.no ? 'Active days felt calmer' : 'Busy days and stress',
      body: `On the ${steps.n} days you reached ${formatInt(p.goals.steps)} steps, your watch's stress averaged ${Math.round(steps.yes)}, against ${Math.round(steps.no)} on the other days.`,
      action: 'Take a 10-minute walk when the day gets busy.',
    })
  }
  const water = split(p.days, (d) => d.mood, (d) => (d.water_ml == null ? null : d.water_ml >= p.goals.water_ml))
  if (water && Math.abs(water.yes - water.no) >= 0.3) {
    out.push({
      area: 'hydration',
      title: 'Water and your mood',
      body: `On the ${water.n} days you reached your water goal, your mood averaged ${water.yes} of 5, against ${water.no} on the other days.`,
      action: 'Keep a bottle in reach and refill it twice before lunch.',
    })
  }
  const avgSteps = mean(p.days.map((d) => d.steps))
  const avgSleep = mean(p.days.map((d) => d.sleep_hours))
  if (out.length < 3 && avgSteps != null && avgSleep != null) {
    out.push({
      area: 'activity',
      title: avgSteps >= p.goals.steps ? 'A steady, active stretch' : 'Room to move more',
      body: `Over these ${p.days.length} days you averaged ${formatInt(Math.round(avgSteps))} steps and ${Math.round(avgSleep * 10) / 10} hours of sleep a day.`,
      action: avgSteps >= p.goals.steps ? 'Keep the routine going this week.' : `Add a short walk to reach ${formatInt(p.goals.steps)} steps on more days.`,
    })
  }
  return out.slice(0, 3)
}
