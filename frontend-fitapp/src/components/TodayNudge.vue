<template>
  <div class="@container/hero">
    <section aria-label="Today at a glance" class="hero hero-panel relative flex flex-col gap-6 rounded-3xl p-5 sm:p-7 @5xl/hero:flex-row @5xl/hero:items-center @5xl/hero:py-9">
      <div class="@container flex min-w-0 flex-1 flex-col">
        <p class="text-[clamp(1.875rem,1.25rem+2.2cqi,2.75rem)] leading-none font-semibold tracking-tight">{{ greeting }}</p>
        <!-- Today's personal line from the AI coach; the fixed reminders stand in without it. -->
        <p class="mt-4 flex items-center gap-1.5 text-xs font-medium tracking-wide text-ink-2 uppercase">
          <ion-icon :icon="sparklesOutline" aria-hidden="true" class="text-sm" />Daily reminder
        </p>
        <p class="mt-1 max-w-lg text-lg leading-snug font-semibold tracking-tight">{{ quote ?? reminder }}</p>
        <p class="mt-3 max-w-md text-sm leading-relaxed text-ink-2">{{ message }}</p>
        <div class="mt-4 flex flex-wrap items-center gap-2">
          <span v-if="streak > 1" class="inline-flex items-center gap-2 rounded-full bg-[var(--chip)] py-1.5 pr-3.5 pl-1.5 text-sm font-medium">
            <span class="grid size-7 place-items-center rounded-full bg-white text-[var(--hero)]">
              <ion-icon :icon="flame" aria-hidden="true" class="text-base" />
            </span>
            <span><span class="tabular">{{ streak }}</span>-day logging streak</span>
          </span>
        </div>
      </div>
  
      <!-- One donut per goal: the ring shows progress, the centre names it and gives the value. -->
      <div class="shrink-0">
        <ul class="grid gap-3 sm:gap-8 xl:gap-12" :class="rings.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'" aria-label="Goals today">
          <li v-for="(r, i) in rings" :key="r.label" class="flex flex-col items-center text-center">
            <div class="relative size-24 sm:size-32">
              <svg viewBox="0 0 120 120" class="size-full -rotate-90" aria-hidden="true">
                <circle cx="60" cy="60" r="52" fill="none" stroke-width="7" stroke="var(--track)" />
                <circle
                  v-if="r.ratio !== null"
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke-width="7"
                  stroke-linecap="round"
                  stroke="#ffffff"
                  class="ring"
                  :style="{ '--len': CIRC, strokeDasharray: CIRC, strokeDashoffset: CIRC * (1 - Math.min(1, r.ratio)), animationDelay: `${i * 90}ms` }"
                />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center px-3">
                <ion-icon :icon="r.reached ? checkmarkCircle : r.icon" aria-hidden="true" class="text-lg text-ink-2 sm:text-xl" />
                <span class="tabular mt-0.5 text-base leading-tight font-semibold tracking-tight sm:text-lg">{{ r.valueText }}</span>
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IonIcon } from '@ionic/vue'
import { checkmarkCircle, flame, sparklesOutline } from 'ionicons/icons'
import { aiQuote, fromAi } from '@/api/ai'
import { ICONS } from '@/components/metricIcons'
import { progress } from '@/data/derive'
import { addDays } from '@/lib/dates'
import { loggingStreak } from '@/data/journalDerive'
import { EMPTY, formatDuration, formatInt } from '@/lib/format'
import { useFitnessStore } from '@/stores/fitness'
import { useJournalStore } from '@/stores/journal'
import type { DaySummary } from '@/types/fitness'

const CIRC = 2 * Math.PI * 52

const props = defineProps<{ day: DaySummary | null | undefined }>()
const fitness = useFitnessStore()
const journal = useJournalStore()

const hour = new Date().getHours()
const greeting = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
const streak = computed(() => loggingStreak(journal.data, fitness.today))

/** Encouragement about movement, rest and routine; never medical advice. One per day, same all day (as in the mobile app). */
const REMINDERS = [
  'Small steps add up. A short walk still counts.',
  'Rest is part of progress, too.',
  "You don't need a perfect day, just a good next step.",
  'Consistency beats intensity.',
  'A glass of water is an easy win right now.',
  'Stand up and stretch for a minute.',
  "Showing up is the hardest part, and you're here.",
]
const reminder = computed(() => REMINDERS[Math.floor(Date.parse(`${fitness.today}T00:00:00Z`) / 86_400_000) % REMINDERS.length])

/** Today's personal line, written by the AI from yesterday's numbers; null keeps the fixed reminder. */
const quote = ref<string | null>(null)
watch(
  () => fitness.today,
  async (today) => {
    const y = fitness.days.find((d) => d.date === addDays(today, -1))
    quote.value = await fromAi(() => aiQuote({
      date: today,
      part_of_day: hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night',
      recent: { steps: y?.activity?.steps ?? null, active_kcal: y?.activity?.activeKcal ?? null, sleep_min: y?.sleep?.durationMin ?? null },
    }), null)
  },
  { immediate: true },
)

const water = computed(() => journal.onDate(props.day?.date ?? fitness.selectedDate).hydration.reduce((n, h) => n + h.volumeMl, 0))

const rings = computed(() => {
  const g = fitness.goals
  const a = props.day?.activity
  return [
    { label: 'Steps', icon: ICONS.steps, ratio: progress(a?.steps, g.steps), valueText: formatInt(a?.steps), goalText: formatInt(g.steps) },
    {
      label: 'Active energy',
      icon: ICONS.activeEnergy,
      ratio: progress(a?.activeKcal, g.activeKcal),
      valueText: a?.activeKcal == null ? EMPTY : `${formatInt(a.activeKcal)} kcal`,
      goalText: `${formatInt(g.activeKcal)} kcal`,
    },
    {
      label: 'Sleep',
      icon: ICONS.sleep,
      ratio: progress(props.day?.sleep?.durationMin, g.sleepMin),
      valueText: formatDuration(props.day?.sleep?.durationMin),
      goalText: formatDuration(g.sleepMin),
    },
    ...(journal.prefs.hydration
      ? [{ label: 'Water', icon: ICONS.water, ratio: progress(water.value, g.waterMl), valueText: `${formatInt(water.value)} ml`, goalText: `${formatInt(g.waterMl)} ml` }]
      : []),
  ].map((r) => ({ ...r, reached: r.ratio !== null && r.ratio >= 1 }))
})

/** One sentence from today's own numbers: what is done, or the nearest goal still open. */
const message = computed(() => {
  const g = fitness.goals
  const steps = props.day?.activity?.steps
  const reached = rings.value.filter((r) => r.ratio != null && r.ratio >= 1).length
  if (reached === rings.value.length) return 'All goals reached today. That is a great day.'
  if (steps != null && steps < g.steps) {
    const left = Math.ceil((g.steps - steps) / 100) * 100
    // ~100 steps a minute is a typical walking cadence.
    const minutes = Math.max(5, Math.round(left / 100 / 5) * 5)
    return `${formatInt(left)} steps to your goal${reached ? `, with ${reached} of ${rings.value.length} goals already reached` : ''}. A ${minutes}-minute walk would roughly cover it.`
  }
  if (reached) return `${reached} of ${rings.value.length} goals reached so far. Keep it up.`
  return 'Your watch data for today will appear here as it syncs.'
})
</script>

<style scoped>
.ring {
  animation: fill 900ms cubic-bezier(0.23, 1, 0.32, 1) both;
}
@keyframes fill {
  from {
    stroke-dashoffset: var(--len);
  }
}
</style>
