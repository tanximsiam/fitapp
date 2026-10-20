<template>
  <AppShell title="Health">
    <template #subtitle>{{ freshness }}</template>
    <DateToolbar :show-range="false" />

    <DataState>
      <div class="stagger grid grid-cols-[minmax(0,1fr)] gap-5">
        <section v-for="g in groups" :key="g.title" :aria-labelledby="`g-${g.key}`">
          <h2 :id="`g-${g.key}`" class="mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">{{ g.title }}</h2>
          <ul class="card divide-y divide-line overflow-hidden">
            <li v-for="m in g.items" :key="m.title">
              <RouterLink :to="m.to" class="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors duration-150 active:bg-page" :class="`tone-${m.tone}`">
                <span class="badge grid size-9 shrink-0 place-items-center rounded-lg" aria-hidden="true"><ion-icon :icon="m.icon" class="text-lg" /></span>
                <span class="min-w-0 flex-1">
                  <span class="block text-[15px] font-semibold">{{ m.title }}</span>
                  <span class="tabular block truncate text-[13px]" :class="m.value ? 'text-ink-2' : 'text-muted'">{{ m.value ?? m.missing }}</span>
                </span>
                <!-- Deviations can be negative, so skin temperature has no height spark. -->
                <span v-if="m.spark.length" class="flex h-7 shrink-0 items-end gap-[3px]" role="img" :aria-label="`${m.title}, last 7 days`">
                  <span
                    v-for="(v, i) in m.spark"
                    :key="i"
                    class="w-1.5 rounded-full"
                    :style="v == null ? { height: '3px', background: 'var(--line)' } : { height: `${Math.max(18, (v / sparkMax(m.spark)) * 100)}%`, background: i === m.spark.length - 1 ? 'var(--tone)' : 'color-mix(in srgb, var(--tone) 40%, transparent)' }"
                  />
                </span>
                <ion-icon :icon="chevronForward" aria-hidden="true" class="shrink-0 text-muted" />
              </RouterLink>
            </li>
          </ul>
        </section>
        <p class="px-1 text-xs leading-relaxed text-muted">
          Values come from {{ mode.isDemo ? 'a simulated watch' : 'your watch uploads' }}. A measurement your watch does not provide shows as not measured; FitApp never estimates it.
        </p>
      </div>
    </DataState>
  </AppShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { chevronForward } from 'ionicons/icons'
import AppShell from '@/components/AppShell.vue'
import DataState from '@/components/DataState.vue'
import DateToolbar from '@/components/DateToolbar.vue'
import { ICONS } from '@/components/metricIcons'
import type { Tone } from '@/components/PanelSection.vue'
import { useFitnessData } from '@/composables/useFitnessData'
import { lastValues } from '@/data/chartData'
import { workoutLabel } from '@/data/connection'
import { formatDeviation } from '@/data/signals'
import { formatDuration, formatInt, formatKm } from '@/lib/format'
import type { DaySummary } from '@/types/fitness'

const { fitness, mode, freshness, days, selectedDay: day } = useFitnessData()

interface Module {
  title: string
  to: string
  icon: string
  tone: Tone
  value: string | null
  missing: string
  spark: (number | null)[]
}

const spark = (pick: (d: DaySummary) => number | null | undefined) => lastValues(days.value, pick)
const sparkMax = (vals: (number | null)[]) => Math.max(1, ...vals.map((v) => v ?? 0))

const groups = computed(() => {
  const d = day.value
  const a = d?.activity
  const w = d?.workouts ?? []
  const fitnessItems: Module[] = [
    { title: 'Activity', to: '/health/activity', icon: ICONS.activity, tone: 'activity', missing: 'Not measured', value: a ? `${formatInt(a.steps)} steps · ${formatKm(a.distanceM)}` : null, spark: spark((x) => x.activity?.steps) },
    {
      title: 'Workouts',
      to: '/health/activity',
      icon: ICONS.workouts,
      tone: 'heart',
      missing: 'No workout recorded',
      value: w.length ? w.map((x) => `${workoutLabel(x.type)} ${formatDuration(x.durationMin)}`).join(' · ') : null,
      spark: spark((x) => (x.workouts.length ? x.workouts.reduce((n, y) => n + y.durationMin, 0) : null)),
    },
    { title: 'Sleep', to: '/health/sleep', icon: ICONS.sleep, tone: 'sleep', missing: 'No sleep recorded', value: d?.sleep ? formatDuration(d.sleep.durationMin) : null, spark: spark((x) => x.sleep?.durationMin) },
  ]
  const bodyItems: Module[] = [
    { title: 'Heart rate', to: '/health/heart-rate', icon: ICONS.heartRate, tone: 'heart', missing: 'Not measured', value: d?.heartRate?.restingBpm != null ? `Resting ${d.heartRate.restingBpm} bpm` : null, spark: spark((x) => x.heartRate?.restingBpm) },
    { title: 'Stress', to: '/health/stress', icon: ICONS.stress, tone: 'stress', missing: 'Not measured', value: d?.stress ? `${d.stress.avg} / 100 average` : null, spark: spark((x) => x.stress?.avg) },
    { title: 'Blood oxygen', to: '/health/blood-oxygen', icon: ICONS.spo2, tone: 'spo2', missing: 'Not measured', value: d?.spo2 ? `${d.spo2.avg}% overnight average` : null, spark: spark((x) => x.spo2?.avg) },
    { title: 'Skin temperature', to: '/health/skin-temperature', icon: ICONS.skinTemp, tone: 'skin', missing: 'Not measured', value: d?.skinTemp ? `${formatDeviation(d.skinTemp.deviationC)} vs your baseline` : null, spark: [] },
  ]
  return [
    { key: 'fitness', title: 'Activity & sleep', items: fitnessItems },
    { key: 'body', title: 'Heart & body', items: bodyItems },
  ]
})
</script>

<style scoped>
.badge {
  background: var(--tone-soft);
  color: var(--tone);
}
.tone-skin .badge {
  color: var(--tone-ink);
}
</style>
