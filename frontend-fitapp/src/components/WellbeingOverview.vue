<template>
  <PanelSection title="Wellbeing overview">
    <template #aside>
      <p class="text-xs text-muted">{{ fitness.rangeDays }} complete days, {{ formatShortDate(window.from) }}–{{ formatShortDate(window.to) }}</p>
    </template>

    <p v-if="summary.length" class="max-w-prose text-[15px] leading-relaxed text-ink">{{ summary.join(' ') }}</p>
    <p v-else class="text-sm text-muted">There are not enough records in this period for a summary yet. Each area below says what is missing.</p>

    <dl class="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-5" aria-label="Data completeness">
      <div v-for="c in coverage" :key="c.area" class="min-w-0">
        <dt class="text-xs text-muted">{{ c.area }}</dt>
        <dd class="tabular mt-0.5 text-sm font-medium">{{ c.count }} / {{ c.total }} days</dd>
        <div class="mt-1 h-1 rounded-full bg-line" aria-hidden="true">
          <div class="h-full rounded-full bg-ink-2" :style="{ width: `${(c.count / c.total) * 100}%` }" />
        </div>
      </div>
    </dl>

    <ul class="mt-6 divide-y divide-line border-y border-line">
      <li v-for="i in insights" :key="i.id" class="py-3">
        <div class="flex flex-wrap items-start gap-x-4 gap-y-1">
          <span class="w-24 shrink-0 text-xs font-medium uppercase tracking-wide" :class="i.status === 'ok' ? 'text-ink-2' : 'text-muted'">{{ AREA_LABELS[i.area] }}</span>
          <p class="min-w-0 flex-1 text-sm" :class="i.status === 'ok' ? 'text-ink' : 'text-muted'">{{ i.text }}</p>
        </div>
        <details class="mt-1 sm:ml-28">
          <summary class="cursor-pointer text-xs text-muted select-none hover:text-ink">How this is calculated</summary>
          <div class="mt-2 rounded-lg bg-page p-3 text-xs text-ink-2">
            <p>{{ i.calculation }}</p>
            <p class="mt-1">Period: {{ formatShortDate(i.range.from) }}–{{ formatShortDate(i.range.to) }}</p>
            <table v-if="i.counts.length" class="mt-2">
              <tbody>
                <tr v-for="c in i.counts" :key="c.label">
                  <th scope="row" class="pr-4 text-left font-normal text-muted">{{ c.label }}</th>
                  <td class="tabular text-ink">{{ c.value }}</td>
                </tr>
              </tbody>
            </table>
            <RouterLink :to="i.link" class="mt-2 inline-block font-medium text-accent underline underline-offset-2">View the records</RouterLink>
          </div>
        </details>
      </li>
    </ul>
    <p class="mt-3 text-xs text-muted">
      Calculated in your browser from the records shown, with fixed rules and minimum amounts of data. These are observations, not medical advice.
    </p>
  </PanelSection>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PanelSection from '@/components/PanelSection.vue'
import { analyse, completeness, summarise, type Area } from '@/insights/engine'
import { addDays } from '@/lib/dates'
import { formatShortDate } from '@/lib/format'
import { useFitnessStore } from '@/stores/fitness'
import { useJournalStore } from '@/stores/journal'

const AREA_LABELS: Record<Area, string> = { activity: 'Activity', sleep: 'Sleep', heart: 'Heart rate', mood: 'Mood', food: 'Food', cycle: 'Cycle', combined: 'Combined' }

const fitness = useFitnessStore()
const journal = useJournalStore()

// A partly finished today would distort averages, so analysis ends at the last complete day.
const window = computed(() => {
  const to = fitness.isToday ? addDays(fitness.selectedDate, -1) : fitness.selectedDate
  return { from: addDays(to, 1 - fitness.rangeDays), to }
})
const insights = computed(() =>
  analyse({ days: fitness.days, journal: journal.data, goals: fitness.goals, prefs: journal.prefs, end: window.value.to, windowDays: fitness.rangeDays }),
)
const summary = computed(() => summarise(insights.value))
const coverage = computed(() => completeness(fitness.days, journal.data, window.value.from, window.value.to, journal.prefs))
</script>
