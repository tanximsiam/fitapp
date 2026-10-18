<template>
  <AppShell title="Skin temperature">
    <template #subtitle>Night ending {{ formatLongDate(fitness.selectedDate) }} · {{ freshness }}</template>
    <DateToolbar />

    <DataState>
      <div class="grid gap-4">
        <PanelSection title="This night">
          <p class="tabular text-3xl font-semibold tracking-tight" :class="day?.skinTemp ? '' : 'text-muted'">{{ formatDeviation(day?.skinTemp?.deviationC) }}</p>
          <p class="mt-1 text-sm text-ink-2">
            {{ day?.skinTemp ? 'compared with your baseline' : 'No skin temperature was recorded for this night.' }}
          </p>
        </PanelSection>

        <PanelSection :title="`Nightly deviation, last ${fitness.rangeDays} nights`">
          <dl class="mb-5 grid grid-cols-3 gap-4">
            <MetricItem label="Nights measured" :value="`${values.length} of ${fitness.rangeDays}`" />
            <MetricItem label="Lowest" :value="values.length ? formatDeviation(Math.min(...values)) : EMPTY" />
            <MetricItem label="Highest" :value="values.length ? formatDeviation(Math.max(...values)) : EMPTY" />
          </dl>
          <LineChart
            :points="dailyLine(rangeDaysList, (d) => d.skinTemp?.deviationC)"
            :x-domain="[0, Math.max(1, rangeDaysList.length - 1)]"
            :x-ticks="dailyTicks(rangeDaysList)"
            :mark-x="rangeDaysList.length - 1"
            :y-domain="[-limit, limit]"
            :format-y="(n: number) => (n === 0 ? 'base' : `${n > 0 ? '+' : '−'}${Math.abs(n).toFixed(1)}`)"
            color="var(--ink-2)"
            unit="°C vs baseline"
            x-name="Night ending"
            description="Nightly skin temperature deviation from baseline, in degrees Celsius"
          />
        </PanelSection>

        <AboutNote>
          <ul class="max-w-prose list-disc space-y-1.5 pl-5 text-sm text-ink-2">
            <li>The watch measures skin temperature at the wrist overnight and reports the difference from your own baseline, not your body temperature.</li>
            <li>Room temperature, bedding and how the watch is worn all change it. FitApp shows the values as recorded and does not interpret them.</li>
          </ul>
        </AboutNote>
      </div>
    </DataState>
  </AppShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AboutNote from '@/components/AboutNote.vue'
import AppShell from '@/components/AppShell.vue'
import LineChart from '@/components/charts/LineChart.vue'
import DataState from '@/components/DataState.vue'
import DateToolbar from '@/components/DateToolbar.vue'
import MetricItem from '@/components/MetricItem.vue'
import PanelSection from '@/components/PanelSection.vue'
import { useFitnessData } from '@/composables/useFitnessData'
import { dailyLine, dailyTicks } from '@/data/chartData'
import { formatDeviation } from '@/data/signals'
import { EMPTY, formatLongDate } from '@/lib/format'

const { fitness, freshness, rangeDaysList, selectedDay: day } = useFitnessData()

const values = computed(() => rangeDaysList.value.map((d) => d.skinTemp?.deviationC).filter((v): v is number => v != null))
/** Symmetric scale around the baseline, in 0.5 °C steps. */
const limit = computed(() => Math.max(1, Math.ceil(Math.max(0, ...values.value.map(Math.abs)) * 2) / 2))
</script>
