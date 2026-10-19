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
        <PrimaryButton v-if="journal.loaded && !loggedToday" label="Log how you feel" @click="ui.openQuickLog('choose')" />
      </div>
    </div>

    <div class="flex items-center gap-5">
      <svg viewBox="0 0 140 140" class="size-32 shrink-0 -rotate-90 sm:size-36" role="img" :aria-label="ringsLabel">
        <g v-for="(r, i) in rings" :key="r.label" fill="none" stroke-width="12" stroke-linecap="round">
          <circle cx="70" cy="70" :r="RADII[i]" stroke="rgb(255 255 255 / 0.18)" />
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
      <div class="min-w-0">
        <ul class="grid gap-3 text-sm" aria-hidden="true">
          <li v-for="r in rings" :key="r.label" class="grid grid-cols-[1rem_auto] items-center gap-x-2">
            <ion-icon :icon="r.icon" class="text-base" :style="{ color: r.color }" />
            <span class="flex items-baseline gap-2">
              <span class="font-semibold">{{ r.label }}</span>
              <span class="tabular font-semibold">{{ r.ratio === null ? '–' : `${Math.round(r.ratio * 100)}%` }}</span>
            </span>
            <span class="tabular col-start-2 text-xs text-ink-2">{{ r.valueText }} of {{ r.goalText }}</span>
          </li>
        </ul>
        <RouterLink to="/settings" class="mt-3 inline-block text-xs text-ink-2 underline underline-offset-2 hover:text-ink">Edit goals</RouterLink>
      </div>
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
import { EMPTY, formatDuration, formatInt } from '@/lib/format'
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

// Light tints of each metric's hue (Tailwind 200-300), readable on the indigo hero.
const rings = computed(() => {
  const g = fitness.goals
  const a = props.day?.activity
  return [
    { label: 'Steps', icon: ICONS.steps, color: '#7dd3fc', ratio: progress(a?.steps, g.steps), valueText: formatInt(a?.steps), goalText: formatInt(g.steps) },
    {
      label: 'Active energy',
      icon: ICONS.activeEnergy,
      color: '#fcd34d',
      ratio: progress(a?.activeKcal, g.activeKcal),
      valueText: a?.activeKcal == null ? EMPTY : `${formatInt(a.activeKcal)} kcal`,
      goalText: `${formatInt(g.activeKcal)} kcal`,
    },
    {
      label: 'Sleep',
      icon: ICONS.sleep,
      color: '#e9d5ff',
      ratio: progress(props.day?.sleep?.durationMin, g.sleepMin),
      valueText: formatDuration(props.day?.sleep?.durationMin),
      goalText: formatDuration(g.sleepMin),
    },
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
/* A solid brand panel: light ink, and white pills for actions. */
.hero {
  background: var(--hero);
  color: #ffffff;
  --ink: #ffffff;
  --ink-2: #e0e7ff;
  --muted: #c7d2fe;
  --page: var(--hero);
  --focus: #ffffff;
  box-shadow: var(--card-shadow);
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
