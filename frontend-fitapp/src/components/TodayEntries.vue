<template>
  <PanelSection :title="fitness.isToday ? 'Your entries today' : 'Your entries this day'">
    <template #aside>
      <RouterLink to="/timeline" class="text-xs text-muted underline-offset-2 hover:text-ink hover:underline">Timeline</RouterLink>
    </template>
    <dl class="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
      <MetricItem v-if="journal.prefs.mood" label="Mood" :value="mood" />
      <MetricItem v-if="journal.prefs.food" label="Meals" :value="String(day.meals.length)" />
      <MetricItem v-if="journal.prefs.food" label="Water" :value="water ? `${formatInt(water)} ml` : EMPTY" />
      <MetricItem v-if="journal.prefs.cycle" label="Cycle" :value="cycle" />
    </dl>
    <div v-if="fitness.isToday" class="mt-4 flex flex-wrap gap-2">
      <PrimaryButton v-if="journal.prefs.mood" variant="secondary" label="Log mood" @click="ui.openQuickLog('mood')" />
      <PrimaryButton v-if="journal.prefs.food" variant="secondary" label="Log meal" @click="ui.openQuickLog('meal')" />
      <PrimaryButton v-if="journal.prefs.food" variant="secondary" label="Log drink" @click="ui.openQuickLog('drink')" />
      <PrimaryButton v-if="journal.prefs.cycle" variant="secondary" label="Log cycle day" @click="ui.openQuickLog('cycle')" />
    </div>
  </PanelSection>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MetricItem from '@/components/MetricItem.vue'
import PanelSection from '@/components/PanelSection.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import { mean } from '@/data/derive'
import { EMPTY, formatInt } from '@/lib/format'
import { useFitnessStore } from '@/stores/fitness'
import { useJournalStore } from '@/stores/journal'
import { useUiStore } from '@/stores/ui'

const fitness = useFitnessStore()
const journal = useJournalStore()
const ui = useUiStore()

const day = computed(() => journal.onDate(fitness.selectedDate))
const mood = computed(() => {
  const avg = mean(day.value.mood.map((e) => e.mood))
  return avg == null ? 'Not logged' : `${avg.toFixed(avg % 1 ? 1 : 0)} / 5`
})
const water = computed(() => day.value.hydration.reduce((a, h) => a + h.volumeMl, 0))
const cycle = computed(() => {
  const c = day.value.cycleDay
  return c ? [c.flow && `${c.flow} flow`, c.symptoms.length ? `${c.symptoms.length} symptoms` : null].filter(Boolean).join(', ') : 'Nothing logged'
})
</script>
