<template>
  <AppShell title="Blood oxygen">
    <template #subtitle>Night ending {{ formatLongDate(fitness.selectedDate) }} · {{ freshness }}</template>
    <DateToolbar />

    <DataState>
      <div class="grid gap-4">
        <PanelSection title="Overnight readings">
          <template #aside>
            <p v-if="readings.length" class="text-xs text-muted">{{ readings.length }} readings, {{ formatClock(readings[0].at) }}–{{ formatClock(readings.at(-1)!.at) }}</p>
          </template>
          <dl class="mb-5 grid grid-cols-3 gap-4">
            <MetricItem label="Average" :value="pct(day?.spo2?.avg)" />
            <MetricItem label="Lowest" :value="pct(day?.spo2?.min)" />
            <MetricItem label="Highest" :value="pct(day?.spo2?.max)" />
          </dl>
          <ReadingsChart
            :readings="readings"
            :loading="loading"
            :error="error"
            color="var(--spo2)"
            unit="%"
            :y-domain="[86, 100]"
            fit-to-readings
            :max-gap="60"
            description="Blood oxygen readings overnight, in percent. Use arrow keys to step through readings."
            empty-text="No blood oxygen readings were recorded for this night."
            @retry="load"
          />
        </PanelSection>

        <PanelSection :title="`Nightly average, last ${fitness.rangeDays} nights`">
          <dl class="mb-5 grid grid-cols-3 gap-4">
            <MetricItem label="Average of nights" :value="pct(mean(avgs))" />
            <MetricItem label="Lowest single reading" :value="mins.length ? pct(Math.min(...mins)) : EMPTY" />
            <MetricItem label="Nights measured" :value="`${avgs.length} of ${fitness.rangeDays}`" />
          </dl>
          <LineChart
            :points="dailyLine(rangeDaysList, (d) => d.spo2?.avg)"
            :x-domain="[0, Math.max(1, rangeDaysList.length - 1)]"
            :x-ticks="dailyTicks(rangeDaysList)"
            :mark-x="rangeDaysList.length - 1"
            :y-domain="[86, 100]"
            color="var(--spo2)"
            unit="%"
            x-name="Night ending"
            description="Average blood oxygen per night"
          />
        </PanelSection>

        <AboutNote>
          <ul class="max-w-prose list-disc space-y-1.5 pl-5 text-sm text-ink-2">
            <li>Wrist readings are estimates and are affected by movement, fit and skin contact.</li>
            <li>FitApp shows the values as recorded. It does not flag or interpret them, and a watch is not a medical device.</li>
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
import ReadingsChart from '@/components/ReadingsChart.vue'
import { useFitnessData } from '@/composables/useFitnessData'
import { useReadings } from '@/composables/useReadings'
import { dailyLine, dailyTicks } from '@/data/chartData'
import { mean } from '@/data/derive'
import { EMPTY, formatClock, formatLongDate } from '@/lib/format'

const { fitness, freshness, rangeDaysList, selectedDay: day } = useFitnessData()
const { readings, loading, error, load } = useReadings('spo2')

const pct = (n: number | null | undefined) => (n == null ? EMPTY : `${Math.round(n)}%`)
const avgs = computed(() => rangeDaysList.value.map((d) => d.spo2?.avg).filter((v): v is number => v != null))
const mins = computed(() => rangeDaysList.value.map((d) => d.spo2?.min).filter((v): v is number => v != null))
</script>
