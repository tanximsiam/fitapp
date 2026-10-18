<template>
  <AppShell title="Activity">
    <template #subtitle>{{ formatLongDate(fitness.selectedDate) }} · {{ freshness }}</template>
    <DateToolbar />

    <DataState>
      <div class="grid gap-4">
        <PanelSection :title="fitness.isToday ? 'So far today' : 'This day'">
          <dl v-if="day?.activity" class="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            <MetricItem label="Steps" :value="formatInt(day.activity.steps)" />
            <MetricItem label="Distance" :value="formatKm(day.activity.distanceM)" />
            <MetricItem label="Active energy" :value="day.activity.activeKcal == null ? EMPTY : `${formatInt(day.activity.activeKcal)} kcal`" />
            <MetricItem label="Active time" :value="formatDuration(day.activity.activeMinutes)" />
          </dl>
          <p v-else class="text-sm text-muted">No activity was recorded on this day.</p>
        </PanelSection>

        <PanelSection :title="`${metric.label}, last ${fitness.rangeDays} days`">
          <template #aside>
            <div role="radiogroup" aria-label="Metric" class="inline-flex rounded-lg border border-line p-0.5">
              <button
                v-for="m in METRICS"
                :key="m.key"
                type="button"
                role="radio"
                :aria-checked="m.key === metricKey"
                class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150"
                :class="m.key === metricKey ? 'bg-ink text-page' : 'text-ink-2 hover:text-ink'"
                @click="metricKey = m.key"
              >
                {{ m.short }}
              </button>
            </div>
          </template>
          <dl class="mb-5 grid grid-cols-3 gap-4">
            <MetricItem label="Total" :value="metric.format(rangeTotal)" />
            <MetricItem label="Daily average" :value="metric.format(rangeAverage)" />
            <MetricItem label="Goal met" :value="`${goalDays} of ${measuredDays}`" note="days" />
          </dl>
          <BarChart
            :bars="metricBars(rangeDaysList, metric.pick, 'var(--activity)', metric.format)"
            :selected-key="fitness.selectedDate"
            :goal="metric.goal()"
            :goal-label="`Goal ${metric.format(metric.goal())}`"
            :format-tick="metric.tick"
            :value-name="metric.label"
            :description="`Daily ${metric.label.toLowerCase()}. Use arrow keys to inspect days and Enter to select one.`"
            @select="fitness.selectDate"
          />
        </PanelSection>

        <PanelSection title="History">
          <div class="-mx-4 overflow-x-auto sm:mx-0">
            <table class="w-full min-w-[34rem] text-left text-sm">
              <thead>
                <tr class="text-xs text-muted">
                  <th scope="col" class="px-4 py-2 font-medium sm:pl-0">Date</th>
                  <th scope="col" class="px-4 py-2 text-right font-medium">Steps</th>
                  <th scope="col" class="px-4 py-2 text-right font-medium">Distance</th>
                  <th scope="col" class="px-4 py-2 text-right font-medium">Active energy</th>
                  <th scope="col" class="px-4 py-2 text-right font-medium sm:pr-0">Active time</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="d in [...rangeDaysList].reverse()"
                  :key="d.date"
                  class="border-t border-line"
                  :class="d.date === fitness.selectedDate ? 'bg-accent-soft/60' : ''"
                >
                  <th scope="row" class="px-4 py-2 font-normal sm:pl-0">
                    <button type="button" class="text-left text-ink underline-offset-2 hover:underline" @click="fitness.selectDate(d.date)">
                      {{ formatWeekday(d.date) }}, {{ formatShortDate(d.date) }}
                    </button>
                  </th>
                  <td class="tabular px-4 py-2 text-right">{{ formatInt(d.activity?.steps) }}</td>
                  <td class="tabular px-4 py-2 text-right">{{ formatKm(d.activity?.distanceM) }}</td>
                  <td class="tabular px-4 py-2 text-right">{{ d.activity?.activeKcal == null ? EMPTY : `${formatInt(d.activity.activeKcal)} kcal` }}</td>
                  <td class="tabular px-4 py-2 text-right sm:pr-0">{{ formatDuration(d.activity?.activeMinutes) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </PanelSection>
      </div>
    </DataState>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import BarChart from '@/components/charts/BarChart.vue'
import { compactNumber } from '@/components/charts/scale'
import DataState from '@/components/DataState.vue'
import DateToolbar from '@/components/DateToolbar.vue'
import MetricItem from '@/components/MetricItem.vue'
import PanelSection from '@/components/PanelSection.vue'
import { useFitnessData } from '@/composables/useFitnessData'
import { metricBars } from '@/data/chartData'
import { mean } from '@/data/derive'
import { EMPTY, formatDuration, formatInt, formatKm, formatLongDate, formatShortDate, formatWeekday } from '@/lib/format'
import type { DaySummary } from '@/types/fitness'

const { fitness, freshness, goals, rangeDaysList, selectedDay: day } = useFitnessData()

const METRICS = [
  { key: 'steps', label: 'Steps', short: 'Steps', pick: (d: DaySummary) => d.activity?.steps, format: (n: number | null) => formatInt(n), tick: compactNumber, goal: () => goals.value.steps },
  {
    key: 'distance',
    label: 'Distance',
    short: 'Distance',
    pick: (d: DaySummary) => d.activity?.distanceM,
    format: (n: number | null) => formatKm(n),
    tick: (n: number) => `${Number((n / 1000).toFixed(1))}`,
    goal: () => goals.value.distanceM,
  },
  {
    key: 'energy',
    label: 'Active energy',
    short: 'Energy',
    pick: (d: DaySummary) => d.activity?.activeKcal,
    format: (n: number | null) => (n == null ? EMPTY : `${formatInt(n)} kcal`),
    tick: compactNumber,
    goal: () => goals.value.activeKcal,
  },
] as const

const metricKey = ref<(typeof METRICS)[number]['key']>('steps')
const metric = computed(() => METRICS.find((m) => m.key === metricKey.value) ?? METRICS[0])

const values = computed(() => rangeDaysList.value.map((d) => metric.value.pick(d)).filter((v): v is number => v != null))
const measuredDays = computed(() => values.value.length)
const rangeTotal = computed(() => (values.value.length ? values.value.reduce((a, b) => a + b, 0) : null))
const rangeAverage = computed(() => mean(values.value))
const goalDays = computed(() => values.value.filter((v) => v >= metric.value.goal()).length)
</script>
