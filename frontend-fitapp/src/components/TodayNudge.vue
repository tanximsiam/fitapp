<template>
  <section aria-label="Today at a glance" class="hero flex flex-col gap-6 rounded-3xl p-5 sm:p-7 lg:flex-row lg:items-center">
    <div class="min-w-0 flex-1">
      <p class="text-3xl font-semibold tracking-tight sm:text-4xl">{{ greeting }}</p>
      <p class="mt-2 max-w-md text-[15px] leading-relaxed text-ink-2">{{ message }}</p>
      <div class="mt-5 flex flex-wrap items-center gap-2">
        <span v-if="streak > 1" class="inline-flex items-center gap-2 rounded-full bg-[var(--chip)] py-1.5 pr-3.5 pl-1.5 text-sm font-medium">
          <span class="grid size-7 place-items-center rounded-full bg-white text-[var(--hero)]">
            <ion-icon :icon="flame" aria-hidden="true" class="text-base" />
          </span>
          <span><span class="tabular">{{ streak }}</span>-day logging streak</span>
        </span>
        <PrimaryButton v-if="journal.loaded && !loggedToday" label="Log how you feel" @click="ui.openQuickLog('choose')" />
        <RouterLink to="/settings" class="px-2 text-sm text-ink-2 underline underline-offset-2 hover:text-ink">Edit goals</RouterLink>
      </div>
    </div>

    <!-- One donut per goal: the ring shows progress, the centre names it and gives the value. -->
    <div class="shrink-0">
      <ul class="grid grid-cols-3 gap-3 sm:gap-6" aria-label="Goals today">
        <li v-for="(r, i) in rings" :key="r.label" class="flex flex-col items-center text-center">
          <div class="relative size-[6.5rem] sm:size-36">
            <svg viewBox="0 0 120 120" class="size-full -rotate-90" aria-hidden="true">
              <circle cx="60" cy="60" r="52" fill="none" stroke-width="11" stroke="var(--track)" />
              <circle
                v-if="r.ratio !== null"
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke-width="11"
                stroke-linecap="round"
                :stroke="r.color"
                class="ring"
                :style="{ '--len': CIRC, strokeDasharray: CIRC, strokeDashoffset: CIRC * (1 - Math.min(1, r.ratio)), animationDelay: `${i * 90}ms` }"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center px-3">
              <ion-icon :icon="r.reached ? checkmarkCircle : r.icon" aria-hidden="true" class="text-lg sm:text-xl" :style="{ color: r.color }" />
              <span class="tabular mt-0.5 text-base leading-tight font-semibold tracking-tight sm:text-xl">{{ r.valueText }}</span>
            </div>
          </div>
          <p class="mt-2 text-sm font-medium">{{ r.label }}</p>
          <p class="tabular text-xs text-ink-2">
            {{ r.reached ? 'Goal reached' : r.ratio === null ? 'Not measured' : `Goal ${r.goalText}` }}
            <span class="sr-only">{{ r.ratio === null ? '' : `, ${Math.round(r.ratio * 100)}% of goal` }}</span>
          </p>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { checkmarkCircle, flame } from 'ionicons/icons'
import { ICONS } from '@/components/metricIcons'
import PrimaryButton from '@/components/PrimaryButton.vue'
import { progress } from '@/data/derive'
import { loggingStreak } from '@/data/journalDerive'
import { EMPTY, formatDuration, formatInt } from '@/lib/format'
import { useFitnessStore } from '@/stores/fitness'
import { useJournalStore } from '@/stores/journal'
import { useUiStore } from '@/stores/ui'
import type { DaySummary } from '@/types/fitness'

const CIRC = 2 * Math.PI * 52

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

// Ring colours follow the theme (see the style block).
const rings = computed(() => {
  const g = fitness.goals
  const a = props.day?.activity
  return [
    { label: 'Steps', icon: ICONS.steps, color: 'var(--ring-1)', ratio: progress(a?.steps, g.steps), valueText: formatInt(a?.steps), goalText: formatInt(g.steps) },
    {
      label: 'Active energy',
      icon: ICONS.activeEnergy,
      color: 'var(--ring-2)',
      ratio: progress(a?.activeKcal, g.activeKcal),
      valueText: a?.activeKcal == null ? EMPTY : `${formatInt(a.activeKcal)} kcal`,
      goalText: `${formatInt(g.activeKcal)} kcal`,
    },
    {
      label: 'Sleep',
      icon: ICONS.sleep,
      color: 'var(--ring-3)',
      ratio: progress(props.day?.sleep?.durationMin, g.sleepMin),
      valueText: formatDuration(props.day?.sleep?.durationMin),
      goalText: formatDuration(g.sleepMin),
    },
  ].map((r) => ({ ...r, reached: r.ratio !== null && r.ratio >= 1 }))
})

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
/*
 * A solid teal section (the brand colour at full strength) takes white type, following the Radix
 * Colors guidance for solid steps. Secondary text uses solid near-white tints (at least 4.5:1).
 */
.hero {
  background: var(--hero);
  color: var(--ink);
  --ink: #ffffff;
  --ink-2: #e3f4f1;
  --muted: #c9e8e3;
  --page: var(--hero);
  --chip: rgb(255 255 255 / 0.14);
  --track: rgb(255 255 255 / 0.16);
  /* Light mode: vivid lime, amber and cyan (Tailwind 300), each at least 3.7:1 on teal 700. */
  --ring-1: #bef264;
  --ring-2: #fcd34d;
  --ring-3: #67e8f9;
  /* Actions on the hero invert: white pill, teal text. */
  --accent: #ffffff;
  --accent-ink: var(--hero);
  --focus: #ffffff;
  box-shadow: var(--card-shadow);
}
/* Dark mode: one teal family on the deep teal. */
:root[data-theme='dark'] .hero {
  --ring-1: #ffffff;
  --ring-2: #ccfbf1;
  --ring-3: #99f6e4;
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
