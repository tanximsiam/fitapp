<template>
  <section aria-label="Today at a glance" class="hero flex flex-col gap-6 rounded-3xl p-5 sm:flex-row sm:items-center sm:p-7">
    <div class="min-w-0 flex-1">
      <p class="text-3xl font-semibold tracking-tight sm:text-4xl">{{ greeting }}</p>
      <p class="mt-2 max-w-md text-[15px] leading-relaxed text-ink-2">{{ message }}</p>
      <div class="mt-5 flex flex-wrap items-center gap-2">
        <span v-if="streak > 1" class="inline-flex items-center gap-2 rounded-full bg-white/10 py-1.5 pr-3.5 pl-1.5 text-sm font-medium">
          <span class="grid size-7 place-items-center rounded-full bg-[#ffb33d] text-[#3a2300]">
            <ion-icon :icon="flame" aria-hidden="true" class="text-base" />
          </span>
          <span><span class="tabular">{{ streak }}</span>-day logging streak</span>
        </span>
        <PrimaryButton v-if="!loggedToday" label="Log how you feel" @click="ui.openQuickLog('choose')" />
      </div>
    </div>

    <div class="flex items-center gap-5">
      <svg viewBox="0 0 140 140" class="size-32 shrink-0 -rotate-90 sm:size-36" role="img" :aria-label="ringsLabel">
        <g v-for="(r, i) in rings" :key="r.label" fill="none" stroke-width="12" stroke-linecap="round">
          <circle cx="70" cy="70" :r="RADII[i]" stroke="rgb(255 255 255 / 0.1)" />
          <circle
            v-if="r.ratio !== null"
            cx="70"
            cy="70"
            :r="RADII[i]"
            :stroke="r.color"
            class="ring"
            :style="{ '--len': circ(RADII[i]), strokeDasharray: circ(RADII[i]), strokeDashoffset: circ(RADII[i]) * (1 - Math.min(1, r.ratio)), animationDelay: `${i * 90}ms` }"
          />
        </g>
      </svg>
      <ul class="grid gap-2.5 text-sm" aria-hidden="true">
        <li v-for="r in rings" :key="r.label" class="flex items-center gap-2">
          <ion-icon :icon="r.icon" class="text-base" :style="{ color: r.color }" />
          <span class="w-14 text-ink-2">{{ r.label }}</span>
          <span class="tabular font-semibold">{{ r.ratio === null ? '–' : `${Math.round(r.ratio * 100)}%` }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { flame } from 'ionicons/icons'
import { ICONS } from '@/components/metricIcons'
import PrimaryButton from '@/components/PrimaryButton.vue'
import { progress } from '@/data/derive'
import { loggingStreak } from '@/data/journalDerive'
import { formatInt } from '@/lib/format'
import { useFitnessStore } from '@/stores/fitness'
import { useJournalStore } from '@/stores/journal'
import { useUiStore } from '@/stores/ui'
import type { DaySummary } from '@/types/fitness'

const RADII = [58, 42, 26]
const circ = (r: number) => 2 * Math.PI * r

const props = defineProps<{ day: DaySummary | null | undefined }>()
const fitness = useFitnessStore()
const journal = useJournalStore()
const ui = useUiStore()

const hour = new Date().getHours()
const greeting = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
const streak = computed(() => loggingStreak(journal.data, fitness.today))
const loggedToday = computed(() => {
  const d = journal.onDate(fitness.today)
  return d.mood.length + d.meals.length + d.hydration.length + (d.cycleDay ? 1 : 0) > 0
})

// Bright hues chosen for the dark hero; they match the metric colours in hue.
const rings = computed(() => {
  const g = fitness.goals
  return [
    { label: 'Steps', icon: ICONS.steps, color: '#4c9bff', ratio: progress(props.day?.activity?.steps, g.steps) },
    { label: 'Energy', icon: ICONS.activeEnergy, color: '#ffb33d', ratio: progress(props.day?.activity?.activeKcal, g.activeKcal) },
    { label: 'Sleep', icon: ICONS.sleep, color: '#a594ff', ratio: progress(props.day?.sleep?.durationMin, g.sleepMin) },
  ]
})
const ringsLabel = computed(() => rings.value.map((r) => `${r.label} ${r.ratio === null ? 'not measured' : `${Math.round(r.ratio * 100)}% of goal`}`).join(', '))

/** One sentence from today's own numbers: what is done, or the nearest goal still open. */
const message = computed(() => {
  const g = fitness.goals
  const steps = props.day?.activity?.steps
  const reached = rings.value.filter((r) => r.ratio != null && r.ratio >= 1).length
  if (reached === 3) return 'All three goals reached today. That is a great day.'
  if (steps != null && steps < g.steps) {
    const left = Math.ceil((g.steps - steps) / 100) * 100
    // ~100 steps a minute is a typical walking cadence.
    const minutes = Math.max(5, Math.round(left / 100 / 5) * 5)
    return `${formatInt(left)} steps to your goal${reached ? `, with ${reached} of 3 goals already reached` : ''}. A ${minutes}-minute walk would roughly cover it.`
  }
  if (reached) return `${reached} of 3 goals reached so far. Keep it up.`
  return 'Your watch data for today will appear here as it syncs.'
})
</script>

<style scoped>
/* A solid dark panel: light ink, and white pills for actions. */
.hero {
  background: #17181b;
  color: #ffffff;
  --ink: #ffffff;
  --ink-2: #d5d7dc;
  --muted: #9ca0a8;
  --page: #17181b;
  --focus: #ffffff;
  box-shadow: var(--card-shadow);
}
:root[data-theme='dark'] .hero {
  background: #232428;
  --page: #232428;
}
.ring {
  animation: fill 900ms cubic-bezier(0.23, 1, 0.32, 1) both;
}
@keyframes fill {
  from {
    stroke-dashoffset: var(--len);
  }
}
</style>
