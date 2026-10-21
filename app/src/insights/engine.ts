import { cycleSummary, deriveCycles, derivePeriods, periodDayIndex } from '@/data/cycle'
import { mean } from '@/data/derive'
import { dailyMoodMean } from '@/data/journalDerive'
import { addDays, dateRange } from '@/lib/dates'
import { formatDuration, formatInt, formatShortDate } from '@/lib/format'
import type { DaySummary, Goals, ISODate } from '@/types/fitness'
import type { JournalData, TrackerPrefs } from '@/types/journal'

/**
 * Rule-based, explainable observations. Every insight states its calculation, date range and the
 * counts behind it, and is withheld (status "insufficient") when the minimum data is missing.
 * Wording describes what the records show; it never diagnoses or implies causation.
 */

export type Area = 'activity' | 'sleep' | 'heart' | 'stress' | 'oxygen' | 'skin' | 'mood' | 'food' | 'cycle' | 'combined'

export interface Insight {
  id: string
  area: Area
  status: 'ok' | 'insufficient'
  text: string
  calculation: string
  range: { from: ISODate; to: ISODate }
  counts: { label: string; value: string }[]
  link: string
}

export interface AnalysisInput {
  /** Watch days, oldest first, covering at least the window and the previous window. */
  days: DaySummary[]
  journal: JournalData
  goals: Goals
  prefs: TrackerPrefs
  /** Last date included in the analysis (complete days only). */
  end: ISODate
  windowDays: number
}

/** Minimum data before a statement is made. */
export const MIN = {
  /** Measured days per window for averages and comparisons: half the window, at least 3. */
  days: (n: number) => Math.max(3, Math.ceil(n / 2)),
  /** Days with both a low-energy check-in and recorded sleep to describe a combined pattern. */
  pairedDays: 5,
  lowEnergyDays: 2,
  periods: 3,
  completedCycles: 3,
}

/** Changes smaller than this are described as "about the same". */
const SAME_PCT = 3

const pct = (cur: number, prev: number) => ((cur - prev) / prev) * 100
const describeChange = (cur: number, prev: number, fmt: (n: number) => string, unit = '') => {
  const p = pct(cur, prev)
  return Math.abs(p) < SAME_PCT
    ? `about the same as the previous period (${fmt(prev)}${unit})`
    : `${Math.abs(Math.round(p))}% ${p > 0 ? 'higher' : 'lower'} than the previous period (${fmt(prev)}${unit})`
}

export function analyse(input: AnalysisInput): Insight[] {
  const { windowDays: n, end } = input
  const from = addDays(end, 1 - n)
  const prevFrom = addDays(from, -n)
  const prevTo = addDays(from, -1)
  const inRange = (d: ISODate, a: ISODate, b: ISODate) => d >= a && d <= b
  const cur = input.days.filter((d) => inRange(d.date, from, end))
  const prev = input.days.filter((d) => inRange(d.date, prevFrom, prevTo))
  const range = { from, to: end }
  const need = MIN.days(n)
  const label = `${formatShortDate(from)}–${formatShortDate(end)}`
  const prevLabel = `${formatShortDate(prevFrom)}–${formatShortDate(prevTo)}`
  const out: Insight[] = []

  const values = (list: DaySummary[], pick: (d: DaySummary) => number | null | undefined) =>
    list.map((d) => pick(d)).filter((v): v is number => v != null)

  /* Activity: goal days and change in average steps. */
  {
    const steps = values(cur, (d) => d.activity?.steps)
    const prevSteps = values(prev, (d) => d.activity?.steps)
    const met = steps.filter((s) => s >= input.goals.steps).length
    const ok = steps.length >= need
    out.push({
      id: 'activity-goal',
      area: 'activity',
      status: ok ? 'ok' : 'insufficient',
      text: ok
        ? `Your watch recorded your step goal of ${formatInt(input.goals.steps)} being reached on ${met} of ${steps.length} days with step data.`
        : `Not enough step data for ${label}: ${steps.length} of ${n} days recorded, ${need} needed.`,
      calculation: `Days in ${label} where recorded steps ≥ ${formatInt(input.goals.steps)}, out of days with any step value.`,
      range,
      counts: [
        { label: 'Goal reached', value: String(met) },
        { label: 'Days with step data', value: `${steps.length} of ${n}` },
      ],
      link: '/activity',
    })
    const okCompare = ok && prevSteps.length >= need
    out.push({
      id: 'activity-change',
      area: 'activity',
      status: okCompare ? 'ok' : 'insufficient',
      text: okCompare
        ? `Average daily steps were ${formatInt(mean(steps))}, ${describeChange(mean(steps)!, mean(prevSteps)!, formatInt)}.`
        : `A step comparison needs ${need} days with data in both ${label} and ${prevLabel}; found ${steps.length} and ${prevSteps.length}.`,
      calculation: `Mean of recorded daily steps in ${label} compared with ${prevLabel}. Days without data are left out, not counted as zero.`,
      range,
      counts: [
        { label: `Days with data, ${label}`, value: String(steps.length) },
        { label: `Days with data, ${prevLabel}`, value: String(prevSteps.length) },
      ],
      link: '/activity',
    })
  }

  /* Sleep. */
  {
    const nights = values(cur, (d) => d.sleep?.durationMin)
    const prevNights = values(prev, (d) => d.sleep?.durationMin)
    const ok = nights.length >= need
    const okCompare = ok && prevNights.length >= need
    const goalNights = nights.filter((m) => m >= input.goals.sleepMin).length
    out.push({
      id: 'sleep-average',
      area: 'sleep',
      status: ok ? 'ok' : 'insufficient',
      text: ok
        ? `Your watch recorded an average of ${formatDuration(mean(nights))} of sleep over ${nights.length} nights${okCompare ? `, ${describeChange(mean(nights)!, mean(prevNights)!, formatDuration)}` : ''}. ${goalNights} of ${nights.length} nights reached your ${formatDuration(input.goals.sleepMin)} goal.`
        : `Not enough sleep data for ${label}: ${nights.length} nights recorded, ${need} needed.`,
      calculation: `Mean time from falling asleep to waking for nights ending in ${label}${okCompare ? `, compared with ${prevLabel}` : ''}. A comparison needs ${need} nights in each period.`,
      range,
      counts: [
        { label: 'Nights recorded', value: `${nights.length} of ${n}` },
        { label: `Nights recorded, ${prevLabel}`, value: String(prevNights.length) },
        { label: 'Nights reaching the goal', value: String(goalNights) },
      ],
      link: '/sleep',
    })
  }

  /* Resting heart rate. */
  {
    const rest = values(cur, (d) => d.heartRate?.restingBpm)
    const prevRest = values(prev, (d) => d.heartRate?.restingBpm)
    const ok = rest.length >= need && prevRest.length >= need
    const diff = ok ? Math.round(mean(rest)! - mean(prevRest)!) : 0
    out.push({
      id: 'resting-hr',
      area: 'heart',
      status: ok ? 'ok' : 'insufficient',
      text: ok
        ? `Resting heart rate averaged ${Math.round(mean(rest)!)} bpm, ${diff === 0 ? 'the same as' : `${Math.abs(diff)} bpm ${diff > 0 ? 'higher than' : 'lower than'}`} the previous period (${Math.round(mean(prevRest)!)} bpm).`
        : `A resting heart-rate comparison needs ${need} days with data in both ${label} and ${prevLabel}; found ${rest.length} and ${prevRest.length}.`,
      calculation: `Mean of the daily resting heart rate reported by the watch, ${label} compared with ${prevLabel}.`,
      range,
      counts: [
        { label: `Days with data, ${label}`, value: String(rest.length) },
        { label: `Days with data, ${prevLabel}`, value: String(prevRest.length) },
      ],
      link: '/heart-rate',
    })
  }

  /* Body signals. Skipped entirely when the source never provides them (e.g. a device without a stress sensor). */
  {
    const stress = values(cur, (d) => d.stress?.avg)
    const prevStress = values(prev, (d) => d.stress?.avg)
    if (stress.length || prevStress.length) {
      const ok = stress.length >= need
      const okCompare = ok && prevStress.length >= need
      out.push({
        id: 'stress-average',
        area: 'stress',
        status: ok ? 'ok' : 'insufficient',
        text: ok
          ? `Your watch's stress estimate averaged ${Math.round(mean(stress)!)} out of 100 over ${stress.length} days${okCompare ? `, ${describeChange(mean(stress)!, mean(prevStress)!, (v) => String(Math.round(v)), ' of 100')}` : ''}.`
          : `A stress average needs ${need} days with readings in ${label}; found ${stress.length}.`,
        calculation: `Mean of the watch's daily average stress (0–100) for ${label}${okCompare ? `, compared with ${prevLabel}` : ''}. Self-reported stress from check-ins is not included.`,
        range,
        counts: [
          { label: `Days with readings, ${label}`, value: String(stress.length) },
          { label: `Days with readings, ${prevLabel}`, value: String(prevStress.length) },
        ],
        link: '/stress',
      })
    }

    const spo2 = cur.filter((d) => d.spo2)
    if (spo2.length || prev.some((d) => d.spo2)) {
      const ok = spo2.length >= need
      out.push({
        id: 'spo2-nights',
        area: 'oxygen',
        status: ok ? 'ok' : 'insufficient',
        text: ok
          ? `Overnight blood oxygen averaged ${Math.round(mean(spo2.map((d) => d.spo2!.avg))!)}% over ${spo2.length} nights; the lowest single reading was ${Math.min(...spo2.map((d) => d.spo2!.min))}%.`
          : `Blood oxygen was recorded on ${spo2.length} nights in ${label}; ${need} are needed for a summary.`,
        calculation: `Mean of nightly SpO₂ averages and the lowest single reading, nights ending ${label}. Values are shown as recorded, without interpretation.`,
        range,
        counts: [{ label: 'Nights with readings', value: `${spo2.length} of ${n}` }],
        link: '/blood-oxygen',
      })
    }

    const skin = values(cur, (d) => d.skinTemp?.deviationC)
    if (skin.length || prev.some((d) => d.skinTemp)) {
      const ok = skin.length >= need
      const fmt = (c: number) => `${c > 0 ? '+' : c < 0 ? '−' : '±'}${Math.abs(c).toFixed(2)} °C`
      out.push({
        id: 'skin-temperature',
        area: 'skin',
        status: ok ? 'ok' : 'insufficient',
        text: ok
          ? `Skin temperature stayed between ${fmt(Math.min(...skin))} and ${fmt(Math.max(...skin))} of your baseline over ${skin.length} nights.`
          : `Skin temperature was recorded on ${skin.length} nights in ${label}; ${need} are needed for a summary.`,
        calculation: `Lowest and highest nightly deviation from the watch's personal baseline, nights ending ${label}.`,
        range,
        counts: [{ label: 'Nights with readings', value: `${skin.length} of ${n}` }],
        link: '/skin-temperature',
      })
    }
  }

  /* Mood. */
  if (input.prefs.mood) {
    const moodCur = dailyMoodMean(input.journal.mood.filter((e) => inRange(e.date, from, end)), (e) => e.mood)
    const moodPrev = dailyMoodMean(input.journal.mood.filter((e) => inRange(e.date, prevFrom, prevTo)), (e) => e.mood)
    const ok = moodCur.size >= need
    const okCompare = ok && moodPrev.size >= need
    const avg = mean([...moodCur.values()])
    out.push({
      id: 'mood-average',
      area: 'mood',
      status: ok ? 'ok' : 'insufficient',
      text: ok
        ? `You logged your mood on ${moodCur.size} of ${n} days, averaging ${avg!.toFixed(1)} out of 5${okCompare ? `, ${describeChange(avg!, mean([...moodPrev.values()])!, (v) => v.toFixed(1), ' of 5')}` : ''}.`
        : `Mood was logged on ${moodCur.size} of ${n} days; ${need} are needed for an average.`,
      calculation: `Each day's check-ins are averaged first, then the days are averaged, ${label}${okCompare ? ` vs ${prevLabel}` : ''}.`,
      range,
      counts: [
        { label: 'Days with a check-in', value: `${moodCur.size} of ${n}` },
        { label: `Days with a check-in, ${prevLabel}`, value: String(moodPrev.size) },
      ],
      link: '/mood',
    })

    /* Combined: low energy and shorter sleep. */
    const energy = dailyMoodMean(input.journal.mood.filter((e) => inRange(e.date, from, end)), (e) => e.energy)
    const sleepByDate = new Map(cur.filter((d) => d.sleep).map((d) => [d.date, d.sleep!.durationMin]))
    const paired = [...energy].filter(([d]) => sleepByDate.has(d))
    const sorted = paired.map(([d]) => sleepByDate.get(d)!).sort((a, b) => a - b)
    const median = sorted.length ? (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.ceil((sorted.length - 1) / 2)]) / 2 : null
    const low = paired.filter(([, e]) => e <= 2)
    const others = paired.filter(([, e]) => e > 2)
    const lowShort = low.filter(([d]) => sleepByDate.get(d)! < median!).length
    const otherShort = others.filter(([d]) => sleepByDate.get(d)! < median!).length
    const ok2 = paired.length >= MIN.pairedDays && low.length >= MIN.lowEnergyDays
    out.push({
      id: 'energy-sleep',
      area: 'combined',
      status: ok2 ? 'ok' : 'insufficient',
      text: ok2
        ? `You logged low energy (2 or less) on ${low.length} days; on ${lowShort} of them your watch recorded less sleep than your typical night in this period (${formatDuration(median)}). On the other ${others.length} days with both records, ${otherShort} had less sleep than that. This shows how often they occurred together, not that one caused the other.`
        : `Comparing energy with sleep needs ${MIN.pairedDays} days with both an energy rating and recorded sleep, including ${MIN.lowEnergyDays} low-energy days; found ${paired.length} and ${low.length}.`,
      calculation: `Days in ${label} with an energy rating and a recorded night. "Less sleep" means shorter than the median of those nights. Energy ratings are averaged per day.`,
      range,
      counts: [
        { label: 'Days with both records', value: String(paired.length) },
        { label: 'Low-energy days', value: String(low.length) },
        { label: 'Low-energy days with less sleep', value: String(lowShort) },
        { label: 'Other days with less sleep', value: `${otherShort} of ${others.length}` },
      ],
      link: '/timeline',
    })
  }

  /* Food and hydration completeness. */
  if (input.prefs.food) {
    const meals = input.journal.meals.filter((m) => inRange(m.date, from, end))
    const mealDays = new Set(meals.map((m) => m.date))
    const fullDays = [...mealDays].filter((d) => meals.filter((m) => m.date === d).length >= 2).length
    const complete = fullDays >= need
    const water = new Map<string, number>()
    for (const h of input.journal.hydration) if (inRange(h.date, from, end)) water.set(h.date, (water.get(h.date) ?? 0) + h.volumeMl)
    out.push({
      id: 'food-completeness',
      area: 'food',
      status: 'ok',
      text: complete
        ? `Meals were logged on ${mealDays.size} of ${n} days (${meals.length} meals); ${fullDays} days have two or more.${water.size ? ` Water was logged on ${water.size} days, ${formatInt(mean([...water.values()]))} ml on average on those days.` : ''}`
        : `Only ${meals.length} meals were logged on ${mealDays.size} of ${n} days, so the food overview is incomplete.${water.size ? ` Water was logged on ${water.size} days.` : ''}`,
      calculation: `Counts of meal entries in ${label}. The overview is treated as complete when at least ${need} days have two or more meals. Water average uses only days with drinks logged.`,
      range,
      counts: [
        { label: 'Meals', value: String(meals.length) },
        { label: 'Days with meals', value: `${mealDays.size} of ${n}` },
        { label: 'Days with 2+ meals', value: String(fullDays) },
        { label: 'Days with water logged', value: String(water.size) },
      ],
      link: '/food',
    })
  }

  /* Cycle: symptoms early in recent periods, and observed cycle lengths. */
  if (input.prefs.cycle) {
    const periods = derivePeriods(input.journal.cycleDays.filter((d) => d.date <= end))
    const last = periods.slice(-3)
    const withCramps = last.filter((p) => p.days.some((d) => (periodDayIndex(p, d.date) ?? 9) <= 2 && d.symptoms.includes('cramps')))
    const ok = periods.length >= MIN.periods
    out.push({
      id: 'cycle-symptoms',
      area: 'cycle',
      status: ok ? 'ok' : 'insufficient',
      text: ok
        ? `${withCramps.length} of your last ${last.length} recorded periods included cramps during the first two days.`
        : `Symptom patterns need ${MIN.periods} recorded periods; ${periods.length} found.`,
      calculation: `The ${Math.min(3, periods.length)} most recent periods derived from your recorded bleeding days, checking symptoms logged on period day 1 or 2.`,
      range: { from: last[0]?.start ?? end, to: end },
      counts: last.map((p) => ({ label: `Started ${formatShortDate(p.start)}`, value: withCramps.includes(p) ? 'cramps' : 'no cramps logged' })),
      link: '/cycle',
    })
    const cycles = deriveCycles(periods)
    const s = cycleSummary(cycles, periods)
    const ok2 = s.completedCycles >= MIN.completedCycles
    out.push({
      id: 'cycle-length',
      area: 'cycle',
      status: ok2 ? 'ok' : 'insufficient',
      text: ok2
        ? `Your ${s.completedCycles} completed cycles on record lasted ${s.shortestCycleDays}–${s.longestCycleDays} days, ${Math.round(s.avgCycleDays!)} on average.`
        : `Cycle lengths need ${MIN.completedCycles} completed cycles; ${s.completedCycles} found.`,
      calculation: 'Days from each recorded period start to the next. Only observed dates are used; nothing is predicted.',
      range: { from: cycles[0]?.start ?? end, to: end },
      counts: [
        { label: 'Completed cycles', value: String(s.completedCycles) },
        { label: 'Recorded periods', value: String(s.recordedPeriods) },
      ],
      link: '/cycle',
    })
  }

  return out
}

/** Short plain-language summary from the strongest supported statements. */
export function summarise(insights: Insight[], limit = 4): string[] {
  return summaryInsights(insights, limit).map((i) => i.text.split(/(?<=\.)\s/)[0])
}

/** The insights the summary is built from, strongest first. */
export function summaryInsights(insights: Insight[], limit = 4): Insight[] {
  const order = ['activity-goal', 'sleep-average', 'energy-sleep', 'mood-average', 'food-completeness', 'cycle-symptoms']
  return order
    .map((id) => insights.find((i) => i.id === id && i.status === 'ok'))
    .filter((i): i is Insight => !!i)
    .slice(0, limit)
}

/** Share of days with any data per area, for the completeness strip. */
export function completeness(days: DaySummary[], journal: JournalData, from: ISODate, to: ISODate, prefs: TrackerPrefs) {
  const dates = dateRange(from, to)
  const has = (pred: (d: ISODate) => boolean) => dates.filter(pred).length
  const byDate = new Map(days.map((d) => [d.date, d]))
  const rows = [
    { area: 'Activity', count: has((d) => !!byDate.get(d)?.activity) },
    { area: 'Sleep', count: has((d) => !!byDate.get(d)?.sleep) },
    { area: 'Heart rate', count: has((d) => !!byDate.get(d)?.heartRate) },
    { area: 'Stress', count: has((d) => !!byDate.get(d)?.stress) },
  ]
  if (prefs.mood) rows.push({ area: 'Mood', count: has((d) => journal.mood.some((e) => e.date === d)) })
  if (prefs.food) rows.push({ area: 'Meals', count: has((d) => journal.meals.some((e) => e.date === d)) })
  return rows.map((r) => ({ ...r, total: dates.length }))
}
