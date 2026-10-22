<template>
  <AppShell title="Timeline">
    <template #subtitle>Watch measurements and your own entries, day by day</template>
    <template #actions>
      <div role="radiogroup" aria-label="Show" class="inline-flex rounded-lg border border-line bg-surface p-0.5">
        <button
          v-for="f in FILTERS"
          :key="f.value"
          type="button"
          role="radio"
          :aria-checked="filter === f.value"
          class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150"
          :class="filter === f.value ? 'bg-accent text-accent-ink' : 'text-ink-2 hover:text-ink'"
          @click="filter = f.value"
        >
          {{ f.label }}
        </button>
      </div>
    </template>

    <DateToolbar />
    <DataState>
      <JournalState>
        <ol id="timeline-days" class="grid gap-6">
          <li v-for="day in timeline.slice(0, visibleDays)" :key="day.date">
            <h2 class="mb-2 text-sm font-semibold">
              <button type="button" class="underline-offset-2 hover:underline" @click="fitness.selectDate(day.date)">{{ formatLongDate(day.date) }}</button>
            </h2>
            <ul v-if="day.rows.length" class="divide-y divide-line card overflow-hidden">
              <li v-for="(row, i) in day.rows" :key="i">
                <RouterLink :to="row.to" class="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-page" @click="fitness.selectDate(day.date)">
                  <span class="tabular w-12 shrink-0 text-ink-2">{{ row.time ?? '' }}</span>
                  <span class="flex w-28 shrink-0 items-center gap-1.5 font-medium">
                    <ion-icon :icon="AREA_ICONS[row.area]" aria-hidden="true" class="shrink-0 text-ink-2" />{{ row.area }}
                  </span>
                  <span class="min-w-0 flex-1 text-ink-2">{{ row.text }}</span>
                  <EntryBadge :kind="row.source" />
                </RouterLink>
              </li>
            </ul>
            <p v-else class="rounded-xl border border-dashed border-line-strong px-4 py-3 text-sm text-muted">Nothing recorded{{ filter === 'all' ? '' : ' for this filter' }}.</p>
          </li>
        </ol>
        <button
          v-if="visibleDays < timeline.length"
          type="button"
          aria-controls="timeline-days"
          class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent transition-transform duration-150 ease-out active:scale-[0.97]"
          @click="visibleDays += 7"
        >
          Show earlier days
          <ion-icon :icon="chevronDownOutline" aria-hidden="true" />
        </button>
      </JournalState>
    </DataState>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IonIcon } from '@ionic/vue'
import { chevronDownOutline } from 'ionicons/icons'
import AppShell from '@/components/AppShell.vue'
import { ICONS } from '@/components/metricIcons'
import DataState from '@/components/DataState.vue'
import DateToolbar from '@/components/DateToolbar.vue'
import EntryBadge from '@/components/EntryBadge.vue'
import JournalState from '@/components/JournalState.vue'
import { useJournalData } from '@/composables/useJournalData'
import { workoutLabel } from '@/data/connection'
import { formatDeviation } from '@/data/signals'
import { activityTitle } from '@/data/activities'
import { energyOrigin, enteredEnergy } from '@/data/journalDerive'
import { formatClock, formatDuration, formatInt, formatKm, formatLongDate } from '@/lib/format'

type Source = 'watch' | 'simulated-watch' | 'manual' | 'simulated'
interface Row {
  time: string | null
  area: string
  text: string
  source: Source
  to: string
}

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'watch', label: 'Watch' },
  { value: 'journal', label: 'Your entries' },
] as const
const filter = ref<(typeof FILTERS)[number]['value']>('all')

const { fitness, journal, mode, rangeDaysList } = useJournalData()

const AREA_ICONS: Record<string, string> = {
  Sleep: ICONS.sleep,
  Activity: ICONS.steps,
  Workout: ICONS.workouts,
  'Heart rate': ICONS.heartRate,
  Oxygen: ICONS.spo2,
  'Skin temp': ICONS.skinTemp,
  Stress: ICONS.stress,
  Mood: ICONS.mood,
  Meal: ICONS.meals,
  Water: ICONS.water,
  'Logged activity': ICONS.workouts,
  Periods: ICONS.cycle,
}

/** Show a few days first; older ones on request. */
const visibleDays = ref(5)
watch([() => fitness.selectedDate, () => fitness.rangeDays, filter], () => (visibleDays.value = 5))

const timeline = computed(() => {
  const watch: Source = mode.isDemo ? 'simulated-watch' : 'watch'
  return [...rangeDaysList.value].reverse().map((d) => {
    const rows: Row[] = []
    if (filter.value !== 'journal') {
      if (d.sleep) rows.push({ time: formatClock(d.sleep.endAt), area: 'Sleep', text: `${formatDuration(d.sleep.durationMin)} · ${formatClock(d.sleep.startAt)}–${formatClock(d.sleep.endAt)}${d.sleep.score != null ? ` · score ${d.sleep.score}` : ''}`, source: watch, to: '/sleep' })
      if (d.activity) rows.push({ time: null, area: 'Activity', text: `${formatInt(d.activity.steps)} steps · ${formatKm(d.activity.distanceM)} · ${formatInt(d.activity.activeKcal)} kcal active`, source: watch, to: '/activity' })
      for (const w of d.workouts) rows.push({ time: formatClock(w.startAt), area: 'Workout', text: `${workoutLabel(w.type)} · ${formatDuration(w.durationMin)}${w.avgBpm ? ` · avg ${w.avgBpm} bpm` : ''}`, source: watch, to: '/activity' })
      if (d.heartRate?.restingBpm != null) rows.push({ time: null, area: 'Heart rate', text: `Resting ${d.heartRate.restingBpm} bpm · ${d.heartRate.sampleCount} readings`, source: watch, to: '/heart-rate' })
      if (d.spo2) rows.push({ time: null, area: 'Oxygen', text: `Overnight ${d.spo2.avg}% average · lowest ${d.spo2.min}%`, source: watch, to: '/blood-oxygen' })
      if (d.skinTemp) rows.push({ time: null, area: 'Skin temp', text: `${formatDeviation(d.skinTemp.deviationC)} vs baseline overnight`, source: watch, to: '/skin-temperature' })
      if (d.stress) rows.push({ time: null, area: 'Stress', text: `Watch estimate ${d.stress.avg}/100 average · ${d.stress.min}–${d.stress.max}`, source: watch, to: '/stress' })
    }
    if (filter.value !== 'watch') {
      const j = journal.onDate(d.date)
      if (journal.prefs.mood)
        for (const e of j.mood)
          rows.push({ time: formatClock(e.recordedAt), area: 'Mood', text: `Mood ${e.mood}/5${e.energy ? ` · energy ${e.energy}/5` : ''}${e.emotions.length ? ` · ${e.emotions.join(', ')}` : ''}`, source: e.provenance, to: '/mood' })
      if (journal.prefs.food) {
        for (const m of j.meals) {
          const e = enteredEnergy([m])
          rows.push({ time: formatClock(m.eatenAt), area: 'Meal', text: `${m.mealType[0].toUpperCase()}${m.mealType.slice(1)}: ${m.items.map((i) => i.name).join(', ')}${e.kcal != null ? ` · ${formatInt(e.kcal)} kcal ${energyOrigin(e)}` : ''}`, source: m.provenance, to: '/food' })
        }
      }
      if (journal.prefs.hydration && j.hydration.length)
        rows.push({ time: null, area: 'Water', text: `${formatInt(j.hydration.reduce((a, h) => a + h.volumeMl, 0))} ml in ${j.hydration.length} drinks`, source: j.hydration[0].provenance, to: '/hydration' })
      for (const a of j.activities)
        rows.push({ time: formatClock(a.startedAt), area: 'Logged activity', text: `${activityTitle(a)} · ${formatDuration(a.durationMin)}${a.energyKcal != null ? ` · ${formatInt(a.energyKcal)} kcal${a.energySource === 'estimated' ? ' (estimated)' : ''}` : ''}`, source: a.provenance, to: '/activity' })
      if (journal.prefs.cycle && j.cycleDay)
        rows.push({ time: null, area: 'Periods', text: [j.cycleDay.flow && `${j.cycleDay.flow} flow`, j.cycleDay.symptoms.join(', ').replace(/_/g, ' ')].filter(Boolean).join(' · '), source: j.cycleDay.provenance, to: '/cycle' })
    }
    rows.sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'))
    return { date: d.date, rows }
  })
})
</script>
