import { activityKind } from '@/data/activities'
import { mean } from '@/data/derive'
import { addDays } from '@/lib/dates'
import type { DaySummary, ISODate } from '@/types/fitness'
import type { ActivityEntry, HydrationEntry } from '@/types/journal'

/**
 * FitApp's health score, 0–100: the average of six parts FitApp can measure, each scored 0–100
 * against a published guideline. Parts without data are left out rather than counted as zero.
 *
 * - Activity: WHO 2020 guideline, 150 minutes of moderate or harder activity a week.
 * - Steps: Paluch et al. 2022 (Lancet Public Health, 15 cohorts): mortality benefit levels off
 *   around 8,000 steps a day.
 * - Sleep duration: AASM/SRS consensus, 7 or more hours (scored best at 7 to under 9).
 * - Sleep regularity: Windred et al. 2024 (Sleep, UK Biobank): regular sleep timing predicts
 *   mortality at least as well as duration. Scored on how much the sleep midpoint varies.
 * - Resting heart rate: Zhang et al. 2016 (CMAJ, 46 cohorts): risk rises about 9% per 10 bpm,
 *   clearly above 80 bpm.
 * - Hydration (when tracked): water logged against the person's goal, set from EFSA's
 *   adequate intake guidance.
 *
 * The parts stay internal: the app shows the number, a label and one tip.
 */

export type ScorePart = 'activity' | 'steps' | 'sleep' | 'regularity' | 'heart' | 'hydration'

/** Minutes of moderate or harder activity a week → points (WHO 150-minute guideline). */
const ACTIVITY_BANDS: [minMinutes: number, points: number][] = [
  [150, 100],
  [120, 90],
  [90, 80],
  [60, 60],
  [30, 40],
  [1, 20],
]
export const activityPoints = (minutes: number) => ACTIVITY_BANDS.find(([min]) => minutes >= min)?.[1] ?? 0

/** Average daily steps → points, rising from 2,000 to the 8,000-step plateau. */
export const STEP_TARGET = 8000
export const stepPoints = (steps: number) => Math.round(Math.min(1, Math.max(0, (steps - 2000) / (STEP_TARGET - 2000))) * 100)

/** Average hours of sleep a night → points. */
export function sleepPoints(hours: number): number {
  if (hours >= 7 && hours < 9) return 100
  if (hours >= 9 && hours < 10) return 85
  if (hours >= 6 && hours < 7) return 70
  if (hours >= 5 && hours < 6) return 40
  if (hours >= 10) return 40
  return 20
}

/** Spread (standard deviation, minutes) of the sleep midpoint across nights → points. */
export function regularityPoints(spreadMin: number): number {
  if (spreadMin <= 30) return 100
  if (spreadMin <= 45) return 85
  if (spreadMin <= 60) return 70
  if (spreadMin <= 90) return 50
  return 25
}

/** Average resting heart rate → points. */
export function heartPoints(bpm: number): number {
  if (bpm <= 60) return 100
  if (bpm <= 70) return 85
  if (bpm <= 80) return 70
  if (bpm <= 90) return 45
  return 25
}

/** Average share of the water goal reached on logged days → points. */
export function hydrationPoints(share: number): number {
  if (share >= 1) return 100
  if (share >= 0.75) return 75
  if (share >= 0.5) return 50
  return 25
}

export const scoreLabel = (score: number) => (score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Needs attention')

export interface HealthScore {
  score: number
  label: string
  /** The part with the most room to grow, if any part is below full marks. */
  focus: ScorePart | null
  /** Internal: each measured part's points and the value behind it. Not shown in the app. */
  parts: { part: ScorePart; points: number; value: number }[]
}

/** Moderate intensity starts at 3 MET in the Compendium of Physical Activities. */
const MODERATE_MET = 3

/** Minutes of a clock time, with times after noon counted the night before so midpoints around midnight stay close. */
function nightMinutes(iso: string): number {
  const [h, m] = iso.slice(11, 16).split(':').map(Number)
  const t = h * 60 + m
  return t >= 12 * 60 ? t - 24 * 60 : t
}

/**
 * The score for the 7 complete days before `today` (a part-finished today would pull averages
 * down), or null when nothing was measured.
 */
export function healthScore(
  days: DaySummary[],
  journal: { activities?: ActivityEntry[]; hydration: HydrationEntry[] },
  today: ISODate,
  waterGoalMl: number | null,
): HealthScore | null {
  const to = addDays(today, -1)
  const from = addDays(to, -6)
  const inWeek = (date: ISODate) => date >= from && date <= to
  const week = days.filter((d) => inWeek(d.date))
  const parts: HealthScore['parts'] = []

  // Activity: per day the larger of the watch's active minutes and moderate activities logged by hand,
  // since a watch often records the session the person also logs.
  const logged = (journal.activities ?? []).filter((a) => inWeek(a.date) && activityKind(a.activityType).met >= MODERATE_MET)
  const activeDates = new Set([...week.filter((d) => d.activity?.activeMinutes != null).map((d) => d.date), ...logged.map((a) => a.date)])
  if (activeDates.size) {
    const minutes = [...activeDates].reduce((sum, date) => {
      const watch = week.find((d) => d.date === date)?.activity?.activeMinutes ?? 0
      const byHand = logged.filter((a) => a.date === date).reduce((n, a) => n + a.durationMin, 0)
      return sum + Math.max(watch, byHand)
    }, 0)
    parts.push({ part: 'activity', points: activityPoints(minutes), value: minutes })
  }

  const steps = mean(week.map((d) => d.activity?.steps ?? null))
  if (steps != null) parts.push({ part: 'steps', points: stepPoints(steps), value: Math.round(steps) })

  const nights = week.map((d) => d.sleep).filter((s): s is NonNullable<DaySummary['sleep']> => s != null)
  if (nights.length) {
    const hours = nights.reduce((n, s) => n + s.durationMin, 0) / nights.length / 60
    parts.push({ part: 'sleep', points: sleepPoints(hours), value: Math.round(hours * 10) / 10 })
  }
  // Regularity needs a few nights to mean anything.
  if (nights.length >= 3) {
    const mids = nights.map((s) => (nightMinutes(s.startAt) + nightMinutes(s.endAt)) / 2)
    const avg = mids.reduce((a, b) => a + b, 0) / mids.length
    const spread = Math.sqrt(mids.reduce((n, m) => n + (m - avg) ** 2, 0) / mids.length)
    parts.push({ part: 'regularity', points: regularityPoints(spread), value: Math.round(spread) })
  }

  const resting = mean(week.map((d) => d.heartRate?.restingBpm ?? null))
  if (resting != null) parts.push({ part: 'heart', points: heartPoints(resting), value: Math.round(resting) })

  if (waterGoalMl) {
    const byDay = new Map<ISODate, number>()
    for (const h of journal.hydration) if (inWeek(h.date)) byDay.set(h.date, (byDay.get(h.date) ?? 0) + h.volumeMl)
    if (byDay.size) {
      const share = [...byDay.values()].reduce((n, ml) => n + Math.min(1, ml / waterGoalMl), 0) / byDay.size
      parts.push({ part: 'hydration', points: hydrationPoints(share), value: Math.round(share * 100) })
    }
  }

  if (!parts.length) return null
  const score = Math.round(parts.reduce((n, p) => n + p.points, 0) / parts.length)
  const weakest = [...parts].sort((a, b) => a.points - b.points)[0]
  return { score, label: scoreLabel(score), focus: weakest.points < 100 ? weakest.part : null, parts }
}
