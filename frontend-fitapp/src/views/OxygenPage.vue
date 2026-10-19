<template>
  <AppShell title="Blood oxygen">
    <template #subtitle>Night ending {{ formatLongDate(fitness.selectedDate) }} · {{ freshness }}</template>
    <DateToolbar />

    <DataState>
      <div class="grid gap-4">
        <ModuleHero
          title="Blood oxygen"
          tone="spo2"
          :icon="ICONS.spo2"
          :eyebrow="`Night ending ${formatLongDate(fitness.selectedDate)}`"
          :headline="pct(day?.spo2?.avg)"
          headline-unit="overnight average"
          :headline-ratio="day?.spo2 ? day.spo2.avg / 100 : null"
          :spark="lastValues(rangeDaysList, (d) => (d.spo2 ? d.spo2.avg - 85 : null))"
          spark-label="Overnight average over the last 7 nights"
          :sentence="sentence"
          :stats="[
            { label: 'Lowest', icon: arrowDown, value: pct(day?.spo2?.min), ratio: day?.spo2 ? day.spo2.min / 100 : null, note: mins.length ? `${pct(Math.min(...mins))} lowest in ${fitness.rangeDays} nights` : undefined },
            { label: 'Highest', icon: arrowUp, value: pct(day?.spo2?.max), ratio: day?.spo2 ? day.spo2.max / 100 : null },
            { label: 'Readings', icon: ICONS.spo2, value: String(readings.length), note: readings.length ? `${formatClock(readings[0].at)}–${formatClock(readings.at(-1)!.at)}` : undefined },
            { label: 'Nights measured', icon: ICONS.sleep, value: `${avgs.length} of ${fitness.rangeDays}`, ratio: avgs.length / fitness.rangeDays },
          ]"
        />

        <div class="@container">
          <div class="grid items-start gap-4 @2xl:grid-cols-2 @[76rem]:grid-cols-3">
            <WidgetCard title="Overnight readings" :icon="ICONS.spo2" tone="spo2" label="Average" :value="pct(day?.spo2?.avg)" :note="`${readings.length} readings`">
              <ReadingsChart
                :readings="readings"
                :loading="loading"
                :error="error"
                :height="CHART"
                color="var(--spo2)"
                unit="%"
                :y-domain="[86, 100]"
                fit-to-readings
                :max-gap="60"
                description="Blood oxygen readings overnight, in percent. Use arrow keys to step through readings."
                empty-text="No blood oxygen readings were recorded for this night."
                legend="Readings, percent"
                @retry="load"
              />
            </WidgetCard>

            <WidgetCard title="Readings by level" :icon="ICONS.spo2" tone="spo2" label="Most readings" :value="topBand" note="this night">
              <BarList :height="AREA" v-if="readings.length" :rows="bandRows" :scale-max="100" color="var(--spo2)" description="Share of this night's readings at each blood oxygen level" />
              <p v-else class="text-sm text-muted">No readings for this night.</p>
            </WidgetCard>

            <WidgetCard class="@2xl:col-span-2 @[76rem]:col-span-1" title="Nightly average" :icon="ICONS.spo2" tone="spo2" label="Average of nights" :value="pct(mean(avgs))">
              <LineChart
                :points="dailyLine(rangeDaysList, (d) => d.spo2?.avg)"
                :x-domain="[0, Math.max(1, rangeDaysList.length - 1)]"
                :x-ticks="edgeTicks"
                :mark-x="rangeDaysList.length - 1"
                :y-domain="[86, 100]"
                :height="CHART"
                color="var(--spo2)"
                unit="%"
                x-name="Night ending"
                description="Average blood oxygen per night"
              >
                <template #legend><span class="flex items-center gap-1.5"><span class="h-0.5 w-3.5 rounded-full bg-[var(--spo2)]" aria-hidden="true" />Overnight average</span></template>
              </LineChart>
            </WidgetCard>
          </div>
        </div>

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
import { ICONS } from '@/components/metricIcons'
import { computed } from 'vue'
import { arrowDown, arrowUp } from 'ionicons/icons'
import AboutNote from '@/components/AboutNote.vue'
import AppShell from '@/components/AppShell.vue'
import BarList from '@/components/charts/BarList.vue'
import LineChart from '@/components/charts/LineChart.vue'
import DataState from '@/components/DataState.vue'
import DateToolbar from '@/components/DateToolbar.vue'
import ModuleHero from '@/components/ModuleHero.vue'
import ReadingsChart from '@/components/ReadingsChart.vue'
import WidgetCard from '@/components/WidgetCard.vue'
import { useFitnessData } from '@/composables/useFitnessData'
import { useReadings } from '@/composables/useReadings'
import { dailyLine, dailyTicks, lastValues } from '@/data/chartData'
import { mean } from '@/data/derive'
import { EMPTY, formatClock, formatLongDate } from '@/lib/format'

const CHART = 130
/** Content height of a chart widget (chart plus its legend row); list widgets fill the same height. */
const AREA = CHART + 28
const BANDS = [
  { label: '98–100%', min: 98, max: 100 },
  { label: '95–97%', min: 95, max: 97 },
  { label: '92–94%', min: 92, max: 94 },
  { label: '90–91%', min: 90, max: 91 },
  { label: 'Under 90%', min: 0, max: 89 },
]

const { fitness, freshness, rangeDaysList, selectedDay: day } = useFitnessData()
const { readings, loading, error, load } = useReadings('spo2')

const pct = (n: number | null | undefined) => (n == null ? EMPTY : `${Math.round(n)}%`)
const avgs = computed(() => rangeDaysList.value.map((d) => d.spo2?.avg).filter((v): v is number => v != null))
const mins = computed(() => rangeDaysList.value.map((d) => d.spo2?.min).filter((v): v is number => v != null))
const edgeTicks = computed(() => dailyTicks(rangeDaysList.value).filter((_, i, all) => i === 0 || i === all.length - 1 || i === Math.floor(all.length / 2)))

const sentence = computed(() => {
  if (!day.value?.spo2) return 'No blood oxygen was recorded for this night.'
  const low = readings.value.length ? readings.value.reduce((a, r) => (r.value < a.value ? r : a)) : null
  return low ? `Lowest single reading ${low.value}% at ${formatClock(low.at)}.` : `Lowest single reading ${day.value.spo2.min}%.`
})

const bandRows = computed(() => {
  const n = readings.value.length || 1
  return BANDS.map((b) => {
    const share = (readings.value.filter((r) => r.value >= b.min && r.value <= b.max).length / n) * 100
    return { label: b.label, value: share, valueText: `${Math.round(share)}%` }
  })
})
const topBand = computed(() => (readings.value.length ? [...bandRows.value].sort((a, b) => b.value - a.value)[0].label : EMPTY))
</script>
