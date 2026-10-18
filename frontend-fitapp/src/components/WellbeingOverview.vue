<template>
  <PanelSection title="Wellbeing overview" :icon="ICONS.combined">
    <template #aside>
      <p class="text-xs text-muted">{{ fitness.rangeDays }} complete days, {{ formatShortDate(window.from) }}–{{ formatShortDate(window.to) }}</p>
    </template>

    <p v-if="summary.length" class="max-w-prose text-[15px] leading-relaxed text-ink">{{ summary.join(' ') }}</p>
    <p v-else class="text-sm text-muted">There are not enough records in this period for a summary yet.</p>

    <ul class="mt-5 divide-y divide-line border-y border-line">
      <InsightRow v-for="i in shown" :key="i.id" :insight="i" />
    </ul>

    <div v-show="expanded" id="wellbeing-more">
      <ul class="divide-y divide-line border-b border-line">
        <InsightRow v-for="i in hidden" :key="i.id" :insight="i" />
      </ul>
      <h3 class="mt-5 mb-2 text-xs font-medium uppercase tracking-wide text-muted">Data coverage</h3>
      <dl class="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
        <div v-for="c in coverage" :key="c.area" class="min-w-0">
          <dt class="text-xs text-muted">{{ c.area }}</dt>
          <dd class="tabular mt-0.5 text-sm font-medium">{{ c.count }} / {{ c.total }} days</dd>
          <div class="mt-1 h-1 rounded-full bg-line" aria-hidden="true">
            <div class="h-full rounded-full bg-ink-2" :style="{ width: `${(c.count / c.total) * 100}%` }" />
          </div>
        </div>
      </dl>
      <p class="mt-4 text-xs text-muted">Calculated in your browser from the records shown, with fixed rules and minimum amounts of data. Observations, not medical advice.</p>
    </div>

    <ShowMore
      v-if="hidden.length"
      v-model:expanded="expanded"
      controls="wellbeing-more"
      :more-label="`Show all ${insights.length} observations and data coverage`"
    />
  </PanelSection>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import InsightRow from '@/components/InsightRow.vue'
import { ICONS } from '@/components/metricIcons'
import PanelSection from '@/components/PanelSection.vue'
import ShowMore from '@/components/ShowMore.vue'
import { analyse, completeness, summarise, summaryInsights } from '@/insights/engine'
import { addDays } from '@/lib/dates'
import { formatShortDate } from '@/lib/format'
import { useFitnessStore } from '@/stores/fitness'
import { useJournalStore } from '@/stores/journal'

/** Shown before "Show all": the statements a person checks first. */
const LEAD = ['activity-goal', 'sleep-average', 'energy-sleep', 'mood-average', 'stress-average', 'resting-hr']
const VISIBLE = 3

const fitness = useFitnessStore()
const journal = useJournalStore()
const expanded = ref(false)

// A partly finished today would distort averages, so analysis ends at the last complete day.
const window = computed(() => {
  const to = fitness.isToday ? addDays(fitness.selectedDate, -1) : fitness.selectedDate
  return { from: addDays(to, 1 - fitness.rangeDays), to }
})
const insights = computed(() =>
  analyse({ days: fitness.days, journal: journal.data, goals: fitness.goals, prefs: journal.prefs, end: window.value.to, windowDays: fitness.rangeDays }),
)
/** Supported statements first, in lead order; withheld ones last. */
const ordered = computed(() => {
  const rank = (id: string) => (LEAD.includes(id) ? LEAD.indexOf(id) : LEAD.length)
  return [...insights.value].sort((a, b) => Number(a.status !== 'ok') - Number(b.status !== 'ok') || rank(a.id) - rank(b.id))
})
const SUMMARY = 2
const summary = computed(() => summarise(insights.value, SUMMARY))
/** Rows skip what the summary already says; those stay available, with their calculations, under "Show all". */
const summarisedIds = computed(() => new Set(summaryInsights(insights.value, SUMMARY).map((i) => i.id)))
const shown = computed(() => ordered.value.filter((i) => !summarisedIds.value.has(i.id)).slice(0, VISIBLE))
const hidden = computed(() => ordered.value.filter((i) => !shown.value.includes(i)))
const coverage = computed(() => completeness(fitness.days, journal.data, window.value.from, window.value.to, journal.prefs))
</script>
