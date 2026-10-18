<template>
  <AppShell title="Stress">
    <template #subtitle>{{ formatLongDate(fitness.selectedDate) }} · {{ freshness }}</template>
    <DateToolbar />

    <DataState>
      <div class="grid gap-4">
        <PanelSection title="Through the day">
          <template #aside>
            <p v-if="readings.length" class="text-xs text-muted">{{ readings.length }} readings</p>
          </template>
          <dl class="mb-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            <MetricItem label="Average" :value="score(day?.stress?.avg)" />
            <MetricItem label="Lowest" :value="score(day?.stress?.min)" />
            <MetricItem label="Highest" :value="score(day?.stress?.max)" />
            <MetricItem label="Latest reading" :value="latest ? score(latest.value) : EMPTY" :note="latest ? `at ${formatClock(latest.at)}` : undefined" />
          </dl>

          <div v-if="readings.length" class="mb-5">
            <div class="flex h-3 w-full gap-0.5 overflow-hidden rounded-full" role="img" :aria-label="zoneSummary">
              <div v-for="z in zones.filter((z) => z.count)" :key="z.key" :style="{ flexGrow: z.count, background: z.color }" />
            </div>
            <ul class="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
              <li v-for="z in zones" :key="z.key" class="flex items-center gap-2">
                <span class="size-2.5 shrink-0 rounded-sm" :style="{ background: z.color }" aria-hidden="true" />
                <span class="text-ink-2">{{ z.label }} <span class="text-xs text-muted">{{ z.min }}–{{ z.max }}</span></span>
                <span class="tabular ml-auto font-medium">{{ Math.round(z.share * 100) }}%</span>
              </li>
            </ul>
            <p class="mt-1 text-xs text-muted">Share of the day's readings in each range.</p>
          </div>

          <ReadingsChart
            :readings="readings"
            :loading="loading"
            :error="error"
            color="var(--stress)"
            unit="/ 100"
            :y-domain="[0, 100]"
            description="Stress readings through the day, 0 to 100. Use arrow keys to step through readings."
            empty-text="No stress readings were recorded on this day."
            @retry="load"
          />
        </PanelSection>

        <PanelSection :title="`Daily average, last ${fitness.rangeDays} days`">
          <dl class="mb-5 grid grid-cols-3 gap-4">
            <MetricItem label="Average of days" :value="score(rangeAvg)" />
            <MetricItem label="Days measured" :value="`${measured.length} of ${fitness.rangeDays}`" />
            <MetricItem label="Highest daily average" :value="measured.length ? score(Math.max(...measured)) : EMPTY" />
          </dl>
          <BarChart
            :bars="metricBars(rangeDaysList, (d) => d.stress?.avg, 'var(--stress)', (n) => `${n} / 100`)"
            :selected-key="fitness.selectedDate"
            value-name="Average stress"
            :format-tick="(n: number) => String(n)"
            description="Average watch stress per day. Use arrow keys to inspect days and Enter to select one."
            @select="fitness.selectDate"
          />
        </PanelSection>

        <AboutNote>
          <ul class="max-w-prose list-disc space-y-1.5 pl-5 text-sm text-ink-2">
            <li>The watch estimates stress from heart-rate variability while you are still. It is not measured during sleep or exercise.</li>
            <li>
              This is separate from the stress you report yourself in
              <RouterLink to="/mood" class="font-medium text-accent underline underline-offset-2">mood check-ins</RouterLink>.
              <template v-if="selfReported != null"> On this day you logged {{ selfReported }}/5.</template>
            </li>
            <li>FitApp shows the readings as recorded and does not interpret them medically.</li>
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
import BarChart from '@/components/charts/BarChart.vue'
import DataState from '@/components/DataState.vue'
import DateToolbar from '@/components/DateToolbar.vue'
import MetricItem from '@/components/MetricItem.vue'
import PanelSection from '@/components/PanelSection.vue'
import ReadingsChart from '@/components/ReadingsChart.vue'
import { useFitnessData } from '@/composables/useFitnessData'
import { useReadings } from '@/composables/useReadings'
import { metricBars } from '@/data/chartData'
import { mean } from '@/data/derive'
import { zoneShares } from '@/data/signals'
import { EMPTY, formatClock, formatLongDate } from '@/lib/format'
import { useJournalStore } from '@/stores/journal'

const { fitness, freshness, rangeDaysList, selectedDay: day } = useFitnessData()
const { readings, loading, error, load } = useReadings('stress')
const journal = useJournalStore()

const score = (n: number | null | undefined) => (n == null ? EMPTY : `${Math.round(n)} / 100`)
const latest = computed(() => readings.value.at(-1) ?? null)
const zones = computed(() => zoneShares(readings.value))
const zoneSummary = computed(() => zones.value.map((z) => `${z.label} ${Math.round(z.share * 100)}%`).join(', '))
const measured = computed(() => rangeDaysList.value.map((d) => d.stress?.avg).filter((v): v is number => v != null))
const rangeAvg = computed(() => mean(measured.value))
const selfReported = computed(() => {
  const v = mean(journal.onDate(fitness.selectedDate).mood.map((e) => e.stress))
  return v == null ? null : Number(v.toFixed(1))
})
</script>
