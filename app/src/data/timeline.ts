import type { EntryBadgeKind } from '@/components/EntryBadge.vue'
import { ICONS } from '@/components/metricIcons'
import { workoutLabel } from '@/data/connection'
import { energyOrigin, enteredEnergy } from '@/data/journalDerive'
import { formatClock, formatDuration, formatInt, formatKm } from '@/lib/format'
import type { DaySummary } from '@/types/fitness'
import type { CycleDay, HydrationEntry, Meal, MoodEntry, TrackerPrefs } from '@/types/journal'

export type Source = EntryBadgeKind
export type TimelineFilter = 'all' | 'watch' | 'journal'

export interface TimelineRow {
  /** Clock time when the record has one; day totals have none and sort last. */
  time: string | null
  area: string
  icon: string
  text: string
  source: Source
  to: string
}

interface JournalDay {
  mood: MoodEntry[]
  meals: Meal[]
  hydration: HydrationEntry[]
  cycleDay: CycleDay | null
}

/** One day's watch records and personal entries, in time order (moved from the web Timeline page). */
export function dayRows(d: DaySummary | null, j: JournalDay, prefs: TrackerPrefs, isDemo: boolean, filter: TimelineFilter = 'all'): TimelineRow[] {
  const rows: TimelineRow[] = []
  const watch: Source = isDemo ? 'simulated-watch' : 'watch'
  if (d && filter !== 'journal') {
    if (d.sleep)
      rows.push({ time: formatClock(d.sleep.endAt), area: 'Sleep', icon: ICONS.sleep, text: `${formatDuration(d.sleep.durationMin)} · ${formatClock(d.sleep.startAt)}–${formatClock(d.sleep.endAt)}${d.sleep.score != null ? ` · score ${d.sleep.score}` : ''}`, source: watch, to: '/health/sleep' })
    for (const w of d.workouts)
      rows.push({ time: formatClock(w.startAt), area: 'Workout', icon: ICONS.workouts, text: `${workoutLabel(w.type)} · ${formatDuration(w.durationMin)}${w.distanceM != null ? ` · ${formatKm(w.distanceM)}` : ''}${w.avgBpm ? ` · avg ${w.avgBpm} bpm` : ''}`, source: watch, to: '/health/workouts' })
    if (d.activity)
      rows.push({ time: null, area: 'Activity', icon: ICONS.steps, text: `${formatInt(d.activity.steps)} steps · ${formatKm(d.activity.distanceM)} · ${formatInt(d.activity.activeKcal)} kcal active`, source: watch, to: '/health/activity' })
  }
  if (filter !== 'watch') {
    if (prefs.mood)
      for (const e of j.mood)
        rows.push({ time: formatClock(e.recordedAt), area: 'Mood', icon: ICONS.mood, text: `Mood ${e.mood}/5${e.energy ? ` · energy ${e.energy}/5` : ''}${e.emotions.length ? ` · ${e.emotions.join(', ')}` : ''}`, source: e.syncState ?? e.provenance, to: '/journal/mood' })
    if (prefs.food) {
      for (const m of j.meals) {
        const e = enteredEnergy([m])
        rows.push({ time: formatClock(m.eatenAt), area: 'Meal', icon: ICONS.meals, text: `${m.mealType[0].toUpperCase()}${m.mealType.slice(1)}: ${m.items.map((i) => i.name).join(', ')}${e.kcal != null ? ` · ${formatInt(e.kcal)} kcal ${energyOrigin(e)}` : ''}`, source: m.syncState ?? m.provenance, to: '/journal/food' })
      }
    }
    if (prefs.hydration)
      for (const h of j.hydration)
        rows.push({ time: formatClock(h.recordedAt), area: 'Water', icon: ICONS.water, text: `${formatInt(h.volumeMl)} ml`, source: h.syncState ?? h.provenance, to: '/journal/food' })
    if (prefs.cycle && j.cycleDay)
      rows.push({ time: null, area: 'Period', icon: ICONS.cycle, text: [j.cycleDay.flow && `${j.cycleDay.flow} flow`, j.cycleDay.symptoms.join(', ').replace(/_/g, ' ')].filter(Boolean).join(' · ') || 'Note', source: j.cycleDay.syncState ?? j.cycleDay.provenance, to: '/journal/cycle' })
  }
  return rows.sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'))
}
