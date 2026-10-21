<template>
  <section aria-labelledby="goals-title">
    <SectionHeading id="goals-title" title="Today's goals" to="/home/settings" link="Edit" />
    <ul class="grid gap-3" :class="goals.length === 4 ? 'grid-cols-2' : 'grid-cols-3'">
      <li v-for="g in goals" :key="g.label">
        <RouterLink :to="g.to" class="card flex h-full flex-col p-3.5 transition-[scale] duration-150 ease-out active:scale-[0.98]" :class="`tone-${g.tone}`">
          <span class="flex items-center gap-1.5 text-[13px] font-medium text-ink-2">
            <ion-icon :icon="g.reached ? checkmarkCircle : g.icon" aria-hidden="true" class="shrink-0 text-[15px]" style="color: var(--tone)" />
            {{ g.label }}
          </span>
          <span class="mt-3 flex items-end justify-between gap-2">
            <span class="min-w-0">
              <span class="tabular block text-[20px] leading-none font-semibold tracking-tight" :class="g.ratio == null ? 'text-muted' : ''">{{ g.value }}</span>
              <span class="tabular mt-1 block text-xs text-muted">{{ g.ratio == null ? 'Not measured' : `of ${g.goal}` }}</span>
            </span>
            <!-- Sleep: a small ring beside the value. -->
            <svg v-if="g.viz === 'ring'" viewBox="0 0 36 36" class="size-10 shrink-0 -rotate-90" role="meter" :aria-label="`${g.label} goal`" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="meterNow(g.ratio)">
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--line)" stroke-width="4" />
              <circle v-if="g.ratio != null" cx="18" cy="18" r="15" fill="none" stroke="var(--tone)" stroke-width="4" stroke-linecap="round" :stroke-dasharray="RING" :stroke-dashoffset="RING * (1 - Math.min(1, g.ratio))" />
            </svg>
            <!-- Water: stacked steps toward the goal, filling from the bottom. -->
            <span v-else-if="g.viz === 'steps'" class="flex h-11 w-3.5 shrink-0 flex-col-reverse gap-0.5" role="meter" :aria-label="`${g.label} goal`" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="meterNow(g.ratio)">
              <span v-for="i in WATER_STEPS" :key="i" class="block flex-1 rounded-[3px] transition-colors duration-300" :style="{ background: i <= Math.floor(Math.min(1, g.ratio ?? 0) * WATER_STEPS) ? 'var(--tone)' : 'var(--line)' }" />
            </span>
          </span>
          <span v-if="g.viz === 'bar'" class="mt-auto block pt-3" role="meter" :aria-label="`${g.label} goal`" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="meterNow(g.ratio)">
            <span class="block h-1.5 overflow-hidden rounded-full bg-line">
              <span v-if="g.ratio != null" class="block h-full rounded-full" :style="{ width: `${Math.min(100, g.ratio * 100)}%`, background: 'var(--tone)' }" />
            </span>
          </span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { checkmarkCircle } from 'ionicons/icons'
import { ICONS } from '@/components/metricIcons'
import type { Tone } from '@/components/PanelSection.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import { progress } from '@/data/derive'
import { EMPTY, formatDuration, formatInt } from '@/lib/format'
import { useFitnessStore } from '@/stores/fitness'
import { useJournalStore } from '@/stores/journal'
import type { DaySummary } from '@/types/fitness'

const RING = 2 * Math.PI * 15
/** Each step is an equal share of the water goal. */
const WATER_STEPS = 8
const meterNow = (ratio: number | null) => (ratio == null ? undefined : Math.min(100, Math.round(ratio * 100)))

const props = defineProps<{ day: DaySummary | null | undefined }>()
const fitness = useFitnessStore()
const journal = useJournalStore()

const goals = computed(() => {
  const g = fitness.goals
  const a = props.day?.activity
  const sleep = props.day?.sleep?.durationMin
  const water = journal.onDate(props.day?.date ?? fitness.selectedDate).hydration.reduce((n, h) => n + h.volumeMl, 0)
  return (
    [
      { label: 'Steps', icon: ICONS.steps, tone: 'activity', to: '/health/activity', viz: 'bar', ratio: progress(a?.steps, g.steps), value: formatInt(a?.steps), goal: formatInt(g.steps) },
      { label: 'Activity', icon: ICONS.activeEnergy, tone: 'energy', to: '/health/activity', viz: 'bar', ratio: progress(a?.activeKcal, g.activeKcal), value: a?.activeKcal == null ? EMPTY : formatInt(a.activeKcal), goal: `${formatInt(g.activeKcal)} kcal` },
      { label: 'Sleep', icon: ICONS.sleep, tone: 'sleep', to: '/health/sleep', viz: 'ring', ratio: progress(sleep, g.sleepMin), value: formatDuration(sleep), goal: formatDuration(g.sleepMin) },
      ...(journal.prefs.hydration
        ? [{
            label: 'Water', icon: ICONS.water, tone: 'activity', to: '/journal/hydration', viz: 'steps',
            ratio: progress(water, g.waterMl), value: `${formatInt(water)} ml`, goal: `${formatInt(g.waterMl)} ml`,
          }]
        : []),
    ] as { label: string; icon: string; tone: Tone; to: string; viz: 'bar' | 'ring' | 'steps'; ratio: number | null; value: string; goal: string }[]
  ).map((x) => ({ ...x, reached: x.ratio != null && x.ratio >= 1 }))
})
</script>
