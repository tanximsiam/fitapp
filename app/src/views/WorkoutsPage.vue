<template>
  <AppShell title="Workouts">
    <template #subtitle>{{ formatLongDate(fitness.selectedDate) }} · {{ freshness }}</template>
    <DateToolbar />

    <DataState>
      <div class="grid grid-cols-[minmax(0,1fr)] gap-4">
        <ModuleHero
          title="Workouts"
          tone="heart"
          :icon="ICONS.workouts"
          :eyebrow="`Last ${fitness.rangeDays} days`"
          :headline="String(workouts.length)"
          :headline-unit="workouts.length === 1 ? 'workout' : 'workouts'"
          :spark="lastValues(rangeDaysList, (d) => (d.workouts.length ? d.workouts.reduce((n, w) => n + w.durationMin, 0) : null))"
          spark-label="Workout minutes over the last 7 days"
          :stats="[
            { label: 'Time', icon: ICONS.activeTime, value: workouts.length ? formatDuration(sum((w) => w.durationMin)) : EMPTY },
            { label: 'Distance', icon: ICONS.distance, value: formatKm(sum((w) => w.distanceM)) },
            { label: 'Active energy', icon: ICONS.activeEnergy, value: kcal(sum((w) => w.activeKcal)) },
            { label: 'Most often', icon: ICONS.workouts, value: topType },
          ]"
        />

        <p v-if="!workouts.length" class="card p-4 text-sm text-muted">No workouts were recorded in the last {{ fitness.rangeDays }} days.</p>
        <section v-for="g in groups" :key="g.date" :aria-labelledby="`w-${g.date}`">
          <h2 :id="`w-${g.date}`" class="mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">{{ formatLongDate(g.date) }}</h2>
          <ul class="grid gap-3">
            <li v-for="w in g.items" :key="w.startAt" class="card p-4">
              <div class="flex items-center gap-3">
                <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--heart-soft)] text-[var(--heart)]" aria-hidden="true">
                  <ion-icon :icon="ICONS.workouts" class="text-lg" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block text-[15px] font-semibold">{{ workoutLabel(w.type) }}</span>
                  <span class="tabular block text-xs text-muted">{{ formatClock(w.startAt) }}–{{ formatClock(w.endAt) }}</span>
                </span>
                <EntryBadge :kind="mode.isDemo ? 'simulated-watch' : 'watch'" />
              </div>
              <!-- Only what the watch recorded; a missing value is left out rather than shown as zero. -->
              <dl class="mt-4 grid grid-cols-3 gap-x-4 gap-y-3">
                <MetricItem label="Duration" :value="formatDuration(w.durationMin)" />
                <MetricItem v-if="w.distanceM != null" label="Distance" :value="formatKm(w.distanceM)" />
                <MetricItem v-if="w.activeKcal != null" label="Energy" :value="kcal(w.activeKcal)" />
                <MetricItem v-if="w.avgBpm != null" label="Avg heart rate" :value="`${w.avgBpm} bpm`" />
                <MetricItem v-if="w.maxBpm != null" label="Max heart rate" :value="`${w.maxBpm} bpm`" />
              </dl>
            </li>
          </ul>
        </section>
      </div>
    </DataState>
  </AppShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import AppShell from '@/components/AppShell.vue'
import DataState from '@/components/DataState.vue'
import DateToolbar from '@/components/DateToolbar.vue'
import EntryBadge from '@/components/EntryBadge.vue'
import MetricItem from '@/components/MetricItem.vue'
import ModuleHero from '@/components/ModuleHero.vue'
import { ICONS } from '@/components/metricIcons'
import { useFitnessData } from '@/composables/useFitnessData'
import { lastValues } from '@/data/chartData'
import { workoutLabel } from '@/data/connection'
import { EMPTY, formatClock, formatDuration, formatInt, formatKm, formatLongDate } from '@/lib/format'
import type { Workout } from '@/types/fitness'

const { fitness, mode, freshness, rangeDaysList } = useFitnessData()

/** Newest first, within the selected range. */
const workouts = computed(() => rangeDaysList.value.flatMap((d) => d.workouts).sort((a, b) => Date.parse(b.startAt) - Date.parse(a.startAt)))
const groups = computed(() => {
  const out: { date: string; items: Workout[] }[] = []
  for (const w of workouts.value) {
    const date = w.startAt.slice(0, 10)
    const last = out.at(-1)
    if (last?.date === date) last.items.push(w)
    else out.push({ date, items: [w] })
  }
  return out
})

/** Total of the recorded values; null when no workout recorded that measure. */
const sum = (pick: (w: Workout) => number | null) => {
  const v = workouts.value.map(pick).filter((x): x is number => x != null)
  return v.length ? v.reduce((a, b) => a + b, 0) : null
}
const kcal = (n: number | null) => (n == null ? EMPTY : `${formatInt(n)} kcal`)
const topType = computed(() => {
  const counts = new Map<string, number>()
  for (const w of workouts.value) counts.set(w.type, (counts.get(w.type) ?? 0) + 1)
  const top = [...counts].sort((a, b) => b[1] - a[1])[0]
  return top ? workoutLabel(top[0]) : EMPTY
})
</script>
