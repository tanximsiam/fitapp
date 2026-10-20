<template>
  <AppShell title="Insights">
    <template #subtitle>{{ fitness.rangeDays }} complete days, {{ formatShortDate(window.from) }}–{{ formatShortDate(window.to) }}</template>
    <template #actions><RangeTabs :model-value="fitness.rangeDays" @update:model-value="fitness.setRange" /></template>

    <DataState>
      <JournalState>
        <div class="stagger grid grid-cols-[minmax(0,1fr)] gap-6">
          <p v-if="!supported.length" class="card p-4 text-sm text-muted">There are not enough records in this period for any observation yet.</p>
          <section v-else aria-labelledby="found-title">
            <h2 id="found-title" :class="HEADING">What your records show · {{ supported.length }}</h2>
            <ul class="card divide-y divide-line px-4">
              <InsightRow v-for="i in supported" :key="i.id" :insight="i" />
            </ul>
          </section>

          <section v-if="withheld.length" aria-labelledby="withheld-title">
            <h2 id="withheld-title" :class="HEADING">Not enough data yet · {{ withheld.length }}</h2>
            <ul class="card divide-y divide-line px-4">
              <InsightRow v-for="i in withheld" :key="i.id" :insight="i" />
            </ul>
            <p class="mt-2 px-1 text-xs leading-relaxed text-muted">FitApp makes a statement only once it has the minimum number of days for it. Keep logging and these fill in.</p>
          </section>

          <section aria-labelledby="coverage-title">
            <h2 id="coverage-title" :class="HEADING">Data coverage</h2>
            <dl class="card grid grid-cols-2 gap-x-6 gap-y-4 p-4">
              <div v-for="c in coverage" :key="c.area" class="min-w-0">
                <dt class="text-xs text-muted">{{ c.area }}</dt>
                <dd class="tabular mt-0.5 text-sm font-medium">{{ c.count }} / {{ c.total }} days</dd>
                <div class="mt-1 h-1 rounded-full bg-line" aria-hidden="true">
                  <div class="h-full rounded-full bg-ink-2" :style="{ width: `${(c.count / c.total) * 100}%` }" />
                </div>
              </div>
            </dl>
          </section>

          <p class="px-1 text-xs leading-relaxed text-muted">
            Calculated on this device from the records shown, with fixed rules. These are associations in your own records, never causes, diagnoses or advice.
          </p>
        </div>
      </JournalState>
    </DataState>
  </AppShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppShell from '@/components/AppShell.vue'
import DataState from '@/components/DataState.vue'
import InsightRow from '@/components/InsightRow.vue'
import JournalState from '@/components/JournalState.vue'
import RangeTabs from '@/components/RangeTabs.vue'
import { useJournalData } from '@/composables/useJournalData'
import { analyse, completeness } from '@/insights/engine'
import { addDays } from '@/lib/dates'
import { formatShortDate } from '@/lib/format'

const HEADING = 'mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase'
/** The statements a person checks first lead the list. */
const LEAD = ['activity-goal', 'sleep-average', 'energy-sleep', 'mood-average', 'stress-average', 'resting-hr']

const { fitness, journal } = useJournalData()

// A part-finished today would distort averages, so the analysis ends at the last complete day.
const window = computed(() => {
  const to = fitness.isToday ? addDays(fitness.selectedDate, -1) : fitness.selectedDate
  return { from: addDays(to, 1 - fitness.rangeDays), to }
})
const insights = computed(() =>
  analyse({ days: fitness.days, journal: journal.data, goals: fitness.goals, prefs: journal.prefs, end: window.value.to, windowDays: fitness.rangeDays }),
)
const rank = (id: string) => (LEAD.includes(id) ? LEAD.indexOf(id) : LEAD.length)
const supported = computed(() => insights.value.filter((i) => i.status === 'ok').sort((a, b) => rank(a.id) - rank(b.id)))
const withheld = computed(() => insights.value.filter((i) => i.status !== 'ok'))
const coverage = computed(() => completeness(fitness.days, journal.data, window.value.from, window.value.to, journal.prefs))
</script>
