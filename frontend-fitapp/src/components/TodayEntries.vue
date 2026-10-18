<template>
  <PanelSection :title="fitness.isToday ? 'Your entries today' : 'Your entries this day'" variant="elevated" :icon="ICONS.mood">
    <template #aside>
      <RouterLink to="/timeline" class="text-xs text-muted underline-offset-2 hover:text-ink hover:underline">Timeline</RouterLink>
    </template>
    <dl class="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
      <MetricItem v-if="journal.prefs.mood" label="Mood" :icon="ICONS.mood" :value="mood" />
      <MetricItem v-if="journal.prefs.food" label="Meals" :icon="ICONS.meals" :value="String(day.meals.length)" />
      <MetricItem v-if="journal.prefs.food" label="Water" :icon="ICONS.water" :value="water ? `${formatInt(water)} ml` : EMPTY" />
      <MetricItem v-if="journal.prefs.cycle" label="Cycle" :icon="ICONS.cycle" :value="cycle" />
    </dl>
    <div v-if="fitness.isToday" class="mt-5 flex flex-wrap gap-2">
      <button
        v-for="a in actions"
        :key="a.kind"
        type="button"
        class="tone inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-[filter,transform] duration-150 ease-out hover:brightness-[0.97] active:scale-[0.97]"
        :class="`tone-${a.tone}`"
        :style="{ color: 'var(--tone-ink)' }"
        @click="ui.openQuickLog(a.kind)"
      >
        <ion-icon :icon="a.icon" aria-hidden="true" />{{ a.label }}
      </button>
    </div>
  </PanelSection>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { ICONS } from '@/components/metricIcons'
import MetricItem from '@/components/MetricItem.vue'
import PanelSection, { type Tone } from '@/components/PanelSection.vue'
import type { LogKind } from '@/stores/ui'
import { mean } from '@/data/derive'
import { EMPTY, formatInt } from '@/lib/format'
import { useFitnessStore } from '@/stores/fitness'
import { useJournalStore } from '@/stores/journal'
import { useUiStore } from '@/stores/ui'

const fitness = useFitnessStore()
const journal = useJournalStore()
const ui = useUiStore()

const day = computed(() => journal.onDate(fitness.selectedDate))

const actions = computed(() =>
  (
    [
      { kind: 'mood', label: 'Log mood', icon: ICONS.mood, tone: 'mood', on: journal.prefs.mood },
      { kind: 'meal', label: 'Log meal', icon: ICONS.meals, tone: 'energy', on: journal.prefs.food },
      { kind: 'drink', label: 'Log drink', icon: ICONS.water, tone: 'activity', on: journal.prefs.food },
      { kind: 'cycle', label: 'Log cycle day', icon: ICONS.cycle, tone: 'mood', on: journal.prefs.cycle },
    ] as { kind: LogKind; label: string; icon: string; tone: Tone; on: boolean }[]
  ).filter((a) => a.on),
)
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
