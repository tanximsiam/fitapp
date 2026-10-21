import { activityKind } from '@/data/activities'
import { addDays } from '@/lib/dates'
import type { DaySummary, ISODate } from '@/types/fitness'
import type { ActivityEntry } from '@/types/journal'

/**
 * FitApp's health score, 0–100, after the American Heart Association's Life's Essential 8
 * (Lloyd-Jones et al., Circulation 2022): each component scores 0–100 and the score is their
 * unweighted average. FitApp measures two of the eight, physical activity and sleep, so the score
 * averages those. The breakdown stays internal; the app shows the number and one tip.
 */

/** LE8 physical activity: minutes of moderate or greater activity per week → points. */
const ACTIVITY_BANDS: [minMinutes: number, points: number][] = [
  [150, 100],
  [120, 90],
  [90, 80],
  [60, 60],
  [30, 40],
  [1, 20],
]
export const activityPoints = (minutes: number) => ACTIVITY_BANDS.find(([min]) => minutes >= min)?.[1] ?? 0

/** LE8 sleep health: average hours per night → points. */
export function sleepPoints(hours: number): number {
  if (hours >= 7 && hours < 9) return 100
  if (hours >= 9 && hours < 10) return 90
  if (hours >= 6 && hours < 7) return 70
  if ((hours >= 5 && hours < 6) || hours >= 10) return 40
  if (hours >= 4) return 20
  return 0
}

/** Moderate intensity starts at 3 MET in the Compendium of Physical Activities. */
const MODERATE_MET = 3

export interface HealthScore {
  score: number
  /** Moderate-or-harder minutes over the last 7 days, or null when nothing was measured. */
  activityMinutes: number | null
  /** Average sleep over the nights recorded in the last 7 days. */
  sleepHours: number | null
  /** The component with the most room to grow, if any. */
  focus: 'activity' | 'sleep' | null
}

/** The score for the 7 days ending `today`, or null when neither component has any data. */
export function healthScore(days: DaySummary[], activities: ActivityEntry[], today: ISODate): HealthScore | null {
  const from = addDays(today, -6)
  const week = days.filter((d) => d.date >= from && d.date <= today)
  const logged = activities.filter((a) => a.date >= from && a.date <= today && activityKind(a.activityType).met >= MODERATE_MET)

  // Per day the larger of the watch's active minutes and the moderate activities logged by hand,
  // since a watch often records the same session the person also logs.
  const dates = new Set([...week.filter((d) => d.activity?.activeMinutes != null).map((d) => d.date), ...logged.map((a) => a.date)])
  const activityMinutes = dates.size
    ? [...dates].reduce((sum, date) => {
        const watch = week.find((d) => d.date === date)?.activity?.activeMinutes ?? 0
        const byHand = logged.filter((a) => a.date === date).reduce((n, a) => n + a.durationMin, 0)
        return sum + Math.max(watch, byHand)
      }, 0)
    : null

  const nights = week.map((d) => d.sleep?.durationMin).filter((m): m is number => m != null)
  const sleepHours = nights.length ? Math.round((nights.reduce((a, b) => a + b, 0) / nights.length / 60) * 10) / 10 : null

  const parts: { key: 'activity' | 'sleep'; points: number }[] = []
  if (activityMinutes != null) parts.push({ key: 'activity', points: activityPoints(activityMinutes) })
  if (sleepHours != null) parts.push({ key: 'sleep', points: sleepPoints(sleepHours) })
  if (!parts.length) return null

  const weakest = [...parts].sort((a, b) => a.points - b.points)[0]
  return {
    score: Math.round(parts.reduce((n, p) => n + p.points, 0) / parts.length),
    activityMinutes,
    sleepHours,
    focus: weakest.points < 100 ? weakest.key : null,
  }
}
