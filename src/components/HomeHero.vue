<template>
  <!-- The day in one sentence. Numbers live in the goal and vitals cards below, so this stays quiet. -->
  <section aria-label="Today at a glance" class="hero-panel rounded-3xl px-6 py-7">
    <p class="text-[26px] leading-tight font-semibold tracking-tight">{{ greeting }}</p>
    <p class="mt-2 text-[15px] leading-relaxed text-ink-2">{{ message }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { progress } from '@/data/derive'
import { formatInt } from '@/lib/format'
import { useFitnessStore } from '@/stores/fitness'
import type { DaySummary } from '@/types/fitness'

const props = defineProps<{ day: DaySummary | null | undefined }>()
const fitness = useFitnessStore()

const hour = new Date().getHours()
const greeting = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

/** One sentence from today's own numbers: what is done, or the nearest goal still open. */
const message = computed(() => {
  const g = fitness.goals
  const a = props.day?.activity
  const reached = [progress(a?.steps, g.steps), progress(a?.activeKcal, g.activeKcal), progress(props.day?.sleep?.durationMin, g.sleepMin)].filter(
    (r) => r != null && r >= 1,
  ).length
  if (reached === 3) return 'All three goals reached today. That is a great day.'
  const steps = a?.steps
  if (steps != null && steps < g.steps) {
    const left = Math.ceil((g.steps - steps) / 100) * 100
    // ~100 steps a minute is a typical walking cadence.
    const minutes = Math.max(5, Math.round(left / 100 / 5) * 5)
    return `${formatInt(left)} steps to your goal. A ${minutes}-minute walk would roughly cover it.`
  }
  if (reached) return `${reached} of 3 goals reached so far. Keep it up.`
  return 'Your watch data for today will appear here as it syncs.'
})
</script>
