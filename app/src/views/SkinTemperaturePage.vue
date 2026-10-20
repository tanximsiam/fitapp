<template>
  <AppShell title="Skin temperature">
    <template #subtitle>Night ending {{ formatLongDate(fitness.selectedDate) }} · {{ freshness }}</template>
    <DateToolbar />

    <DataState>
      <div class="grid gap-4">
        <ModuleHero
          title="Skin temperature"
          tone="skin"
          :icon="ICONS.skinTemp"
          :eyebrow="`Night ending ${formatLongDate(fitness.selectedDate)}`"
          :headline="formatDeviation(day?.skinTemp?.deviationC)"
          headline-unit="vs your baseline"
          :sentence="sentence"
          :stats="[
            { label: 'Average', icon: ICONS.skinTemp, value: values.length ? formatDeviation(mean(values)) : EMPTY, note: `${fitness.rangeDays}-night average` },
            { label: 'Lowest', icon: arrowDown, value: values.length ? formatDeviation(Math.min(...values)) : EMPTY },
            { label: 'Highest', icon: arrowUp, value: values.length ? formatDeviation(Math.max(...values)) : EMPTY },
            { label: 'Nights measured', icon: ICONS.sleep, value: `${values.length} of ${fitness.rangeDays}`, ratio: values.length / fitness.rangeDays },
          ]"
        />

        <div class="@container">
          <div class="grid items-start gap-4 @2xl:grid-cols-2 @[76rem]:grid-cols-3">
            <WidgetCard class="@2xl:col-span-2" title="Nightly change" :icon="ICONS.skinTemp" tone="skin" label="This night" :value="formatDeviation(day?.skinTemp?.deviationC)">
              <LineChart
                :points="dailyLine(rangeDaysList, (d) => d.skinTemp?.deviationC)"
                :x-domain="[0, Math.max(1, rangeDaysList.length - 1)]"
                :x-ticks="dailyTicks(rangeDaysList)"
                :mark-x="rangeDaysList.length - 1"
                :y-domain="[-limit, limit]"
                :format-y="(n: number) => (n === 0 ? 'base' : `${n > 0 ? '+' : '−'}${Math.abs(n).toFixed(1)}`)"
                :height="CHART"
                color="var(--ink-2)"
                unit="°C vs baseline"
                x-name="Night ending"
                description="Nightly skin temperature change from your baseline, in degrees Celsius"
              >
                <template #legend><span class="flex items-center gap-1.5"><span class="h-0.5 w-3.5 rounded-full bg-ink-2" aria-hidden="true" />Change from your baseline, °C</span></template>
              </LineChart>
            </WidgetCard>

            <WidgetCard class="@2xl:col-span-2 @[76rem]:col-span-1" title="Nights by change" :icon="ICONS.skinTemp" tone="skin" label="Within ±0.25 °C" :value="`${near} of ${values.length}`" note="nights">
              <BarList :height="AREA" v-if="values.length" :rows="bandRows" :description="`Nights by skin temperature change over the last ${fitness.rangeDays} nights`" color="var(--ink-2)" />
              <p v-else class="text-sm text-muted">No nights measured in this period.</p>
            </WidgetCard>
          </div>
        </div>

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
import WidgetCard from '@/components/WidgetCard.vue'
import { useFitnessData } from '@/composables/useFitnessData'
import { dailyLine, dailyTicks } from '@/data/chartData'
import { mean } from '@/data/derive'
import { formatDeviation } from '@/data/signals'
import { EMPTY, formatLongDate } from '@/lib/format'

const CHART = 130
/** Content height of a chart widget (chart plus its legend row); list widgets fill the same height. */
const AREA = CHART + 28
const BANDS = [
  { label: 'Above +0.5', test: (v: number) => v > 0.5 },
  { label: '+0.25 to +0.5', test: (v: number) => v > 0.25 && v <= 0.5 },
  { label: 'Within ±0.25', test: (v: number) => Math.abs(v) <= 0.25 },
  { label: '−0.25 to −0.5', test: (v: number) => v < -0.25 && v >= -0.5 },
  { label: 'Below −0.5', test: (v: number) => v < -0.5 },
]

const { fitness, freshness, rangeDaysList, selectedDay: day } = useFitnessData()
const values = computed(() => rangeDaysList.value.map((d) => d.skinTemp?.deviationC).filter((v): v is number => v != null))
/** Symmetric scale around the baseline, in 0.5 °C steps. */
const limit = computed(() => Math.max(1, Math.ceil(Math.max(0, ...values.value.map(Math.abs)) * 2) / 2))
const near = computed(() => values.value.filter((v) => Math.abs(v) <= 0.25).length)
const bandRows = computed(() => BANDS.map((b) => ({ label: b.label, value: values.value.filter(b.test).length, valueText: `${values.value.filter(b.test).length}` })))
const sentence = computed(() => {
  const v = day.value?.skinTemp?.deviationC
  if (v == null) return 'No skin temperature was recorded for this night.'
  return Math.abs(v) <= 0.25 ? 'Close to your usual overnight temperature.' : `${v > 0 ? 'Warmer' : 'Cooler'} than your usual overnight temperature.`
})
</script>
