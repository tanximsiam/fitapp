<template>
  <section aria-label="Today at a glance" class="card flex flex-wrap items-center gap-x-6 gap-y-3 p-4 sm:p-5">
    <div class="min-w-0 flex-1">
      <p class="text-lg font-semibold tracking-tight">{{ greeting }}</p>
      <p class="mt-0.5 text-sm text-ink-2">{{ message }}</p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <span v-if="streak > 1" class="inline-flex items-center gap-1.5 rounded-full bg-page px-3 py-1.5 text-sm font-medium">
        <ion-icon :icon="flame" aria-hidden="true" class="text-base" :style="{ color: 'var(--energy)' }" />
        <span><span class="tabular">{{ streak }}</span>-day logging streak</span>
      </span>
      <PrimaryButton v-if="!loggedToday" label="Log how you feel" @click="ui.openQuickLog('choose')" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { flame } from 'ionicons/icons'
import PrimaryButton from '@/components/PrimaryButton.vue'
import { progress } from '@/data/derive'
import { loggingStreak } from '@/data/journalDerive'
import { formatInt } from '@/lib/format'
import { useFitnessStore } from '@/stores/fitness'
import { useJournalStore } from '@/stores/journal'
import { useUiStore } from '@/stores/ui'
import type { DaySummary } from '@/types/fitness'

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

/** One sentence from today's own numbers: what is done, or the nearest goal still open. */
const message = computed(() => {
  const g = fitness.goals
  const steps = props.day?.activity?.steps
  const goals = [progress(steps, g.steps), progress(props.day?.activity?.activeKcal, g.activeKcal), progress(props.day?.sleep?.durationMin, g.sleepMin)]
  const reached = goals.filter((r) => r != null && r >= 1).length
  if (reached === 3) return 'All three goals reached today. That is a great day.'
  if (steps != null && steps < g.steps) {
    const left = Math.ceil((g.steps - steps) / 100) * 100
    // ~100 steps a minute is a typical walking cadence.
    const minutes = Math.max(5, Math.round(left / 100 / 5) * 5)
    return `${formatInt(left)} steps to your goal${reached ? `, with ${reached} of 3 goals already reached` : ''}. A ${minutes}-minute walk would about cover it.`
  }
  if (reached) return `${reached} of 3 goals reached so far. Keep it up.`
  return 'Your watch data for today will appear here as it syncs.'
})
</script>
