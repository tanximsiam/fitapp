<template>
  <AppShell title="Heart rate">
    <template #subtitle>{{ formatLongDate(fitness.selectedDate) }} · {{ freshness }}</template>
    <DateToolbar />

    <DataState>
      <div class="grid gap-4">
        <ModuleHero
          title="Heart rate"
          tone="heart"
          :icon="ICONS.heartRate"
          :eyebrow="fitness.isToday ? 'Today' : formatLongDate(fitness.selectedDate)"
          :headline="hr?.restingBpm == null ? EMPTY : String(hr.restingBpm)"
          headline-unit="bpm resting"
          :spark="lastValues(rangeDaysList, (d) => d.heartRate?.restingBpm)"
          spark-label="Resting heart rate over the last 7 days"
          :sentence="latestSentence"
          :stats="[
            { label: 'Average', icon: ICONS.heartRate, value: bpm(hr?.avgBpm), note: `7-day resting ${bpm(restingTrend.current)}` },
            { label: 'Lowest', icon: arrowDown, value: bpm(hr?.minBpm) },
            { label: 'Highest', icon: arrowUp, value: bpm(hr?.maxBpm) },
            { label: 'Readings', icon: ICONS.spo2, value: String(samples.length), note: samples.length ? `${formatClock(samples[0].at)}–${formatClock(samples.at(-1)!.at)}` : undefined },
          ]"
        />

        <div class="@container">
          <div class="grid items-start gap-4 @2xl:grid-cols-2 @[76rem]:grid-cols-3">
            <WidgetCard class="@2xl:col-span-2" title="Through the day" :icon="ICONS.heartRate" tone="heart" label="Average" :value="bpm(hr?.avgBpm)" :note="`${samples.length} readings`">
              <div v-if="samplesLoading && !samples.length" class="h-[130px] animate-pulse rounded-lg bg-line/60" aria-busy="true" aria-label="Loading readings" />
              <StatePanel v-else-if="samplesError" kind="error" title="Readings could not be loaded">
                {{ samplesError }}
                <template #actions><PrimaryButton variant="secondary" label="Try again" @click="loadSamples" /></template>
              </StatePanel>
              <p v-else-if="!samples.length" class="py-8 text-center text-sm text-muted">No heart-rate readings were recorded on this day.</p>
              <LineChart
                v-else
                :points="samplePoints"
                :x-domain="[0, 1440]"
                :x-ticks="HOUR_TICKS"
                :max-gap="30"
                :height="CHART"
                color="var(--heart)"
                unit="bpm"
                x-name="Time"
                description="Heart rate readings through the day. Use arrow keys to step through readings."
              >
                <template #legend><span class="flex items-center gap-1.5"><span class="h-0.5 w-3.5 rounded-full bg-heart" aria-hidden="true" />Readings uploaded by the watch</span></template>
              </LineChart>
            </WidgetCard>

            <WidgetCard title="Readings by range" :icon="ICONS.heartRate" tone="heart" label="Most time" :value="topZone" :note="fitness.isToday ? 'today' : 'this day'">
              <BarList :height="AREA" v-if="samples.length" :rows="zoneRows" :scale-max="100" color="var(--heart)" description="Share of the day's readings in each heart-rate range" />
              <p v-else class="text-sm text-muted">No readings on this day.</p>
            </WidgetCard>

            <WidgetCard title="Resting heart rate" :icon="ICONS.heartRate" tone="heart" label="7-day average" :value="bpm(restingTrend.current)" :note="restingTrend.changePct == null ? undefined : `${formatPercentChange(restingTrend.changePct)} vs the previous 7`">
              <LineChart
                :points="dailyLine(rangeDaysList, (d) => d.heartRate?.restingBpm)"
                :x-domain="[0, Math.max(1, rangeDaysList.length - 1)]"
                :x-ticks="edgeTicks"
                :mark-x="rangeDaysList.length - 1"
                :height="CHART"
                color="var(--heart)"
                unit="bpm"
                x-name="Date"
                description="Resting heart rate by day"
              >
                <template #legend><span class="flex items-center gap-1.5"><span class="h-0.5 w-3.5 rounded-full bg-heart" aria-hidden="true" />Resting heart rate</span></template>
              </LineChart>
            </WidgetCard>

            <WidgetCard class="@2xl:col-span-2" title="Daily range" :icon="ICONS.heartRate" tone="heart" label="Widest" :value="widestRange" note="lowest to highest">
              <BarChart
                :bars="rangeBars(rangeDaysList, (d) => (d.heartRate?.minBpm != null && d.heartRate?.maxBpm != null ? { min: d.heartRate.minBpm, max: d.heartRate.maxBpm } : null), 'var(--heart)', (n) => `${Math.round(n)}`)"
                :selected-key="fitness.selectedDate"
                :height="CHART"
                value-name="Heart rate range, bpm"
                description="Lowest to highest heart rate per day. Use arrow keys to inspect days and Enter to select one."
                @select="fitness.selectDate"
              >
                <template #legend><span class="flex items-center gap-1.5"><span class="h-2.5 w-1.5 rounded-sm bg-heart" aria-hidden="true" />Lowest to highest, bpm</span></template>
              </BarChart>
            </WidgetCard>
          </div>
        </div>
      </div>
    </DataState>
  </AppShell>
</template>

<script setup lang="ts">
import { ICONS } from '@/components/metricIcons'
import { computed, ref, watch } from 'vue'
import { arrowDown, arrowUp } from 'ionicons/icons'
import AppShell from '@/components/AppShell.vue'
import BarChart from '@/components/charts/BarChart.vue'
import BarList from '@/components/charts/BarList.vue'
import LineChart from '@/components/charts/LineChart.vue'
import DataState from '@/components/DataState.vue'
import DateToolbar from '@/components/DateToolbar.vue'
import ModuleHero from '@/components/ModuleHero.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import StatePanel from '@/components/StatePanel.vue'
import WidgetCard from '@/components/WidgetCard.vue'
import { errorMessage } from '@/api/client'
import { useFitnessData } from '@/composables/useFitnessData'
import { dailyLine, dailyTicks, lastValues, rangeBars } from '@/data/chartData'
import { trend } from '@/data/derive'
import { wallMinutes } from '@/lib/dates'
import { EMPTY, formatClock, formatLongDate, formatPercentChange, formatShortDate } from '@/lib/format'
import type { HeartRateSample } from '@/types/fitness'

const CHART = 130
/** Content height of a chart widget (chart plus its legend row); list widgets fill the same height. */
const AREA = CHART + 28
const HOUR_TICKS = [0, 6, 12, 18, 24].map((h) => ({ value: h * 60, label: `${String(h).padStart(2, '0')}:00` }))
/** Descriptive bands for the day's readings; not training zones (those need a personal maximum). */
const BANDS = [
  { label: 'Under 60', min: 0, max: 59 },
  { label: '60–79', min: 60, max: 79 },
  { label: '80–99', min: 80, max: 99 },
  { label: '100–119', min: 100, max: 119 },
  { label: '120 and up', min: 120, max: 999 },
]

const { fitness, mode, freshness, days, rangeDaysList, selectedDay } = useFitnessData()
const bpm = (n: number | null | undefined) => (n == null ? EMPTY : `${Math.round(n)} bpm`)
const hr = computed(() => selectedDay.value?.heartRate ?? null)
const edgeTicks = computed(() => dailyTicks(rangeDaysList.value).filter((_, i, all) => i === 0 || i === all.length - 1 || i === Math.floor(all.length / 2)))

// Trends use complete days only, so a partly recorded today does not pull them.
const completeDays = computed(() => (fitness.isToday ? days.value.slice(0, -1) : days.value))
const restingTrend = computed(() => trend(completeDays.value, (d) => d.heartRate?.restingBpm))

const latestSentence = computed(() => {
  const l = fitness.status?.latestHeartRate
  if (!l) return 'No heart-rate reading has been uploaded yet.'
  const day = l.at.slice(0, 10) === fitness.today ? '' : ` on ${formatShortDate(l.at.slice(0, 10))}`
  return `Latest reading ${l.bpm} bpm at ${formatClock(l.at)}${day}: the last value uploaded by the watch, not live.`
})

const samples = ref<HeartRateSample[]>([])
const samplesLoading = ref(false)
const samplesError = ref<string | null>(null)
let request = 0
async function loadSamples() {
  const id = ++request
  samplesLoading.value = true
  samplesError.value = null
  try {
    const result = await mode.adapter.getHeartRate(fitness.selectedDate)
    if (id === request) samples.value = result
  } catch (err) {
    if (id === request) {
      samples.value = []
      samplesError.value = errorMessage(err, 'Could not load heart-rate readings.')
    }
  } finally {
    if (id === request) samplesLoading.value = false
  }
}
watch(() => [fitness.selectedDate, mode.mode], loadSamples, { immediate: true })
const samplePoints = computed(() => samples.value.map((s) => ({ x: wallMinutes(s.at), label: formatClock(s.at), value: s.bpm })))

const zoneRows = computed(() => {
  const n = samples.value.length || 1
  return BANDS.map((b) => {
    const share = (samples.value.filter((s) => s.bpm >= b.min && s.bpm <= b.max).length / n) * 100
    return { label: `${b.label} bpm`, value: share, valueText: `${Math.round(share)}%` }
  })
})
const topZone = computed(() => (samples.value.length ? [...zoneRows.value].sort((a, b) => b.value - a.value)[0].label : EMPTY))
const widestRange = computed(() => {
  const spans = rangeDaysList.value.flatMap((d) => (d.heartRate?.minBpm != null && d.heartRate?.maxBpm != null ? [d.heartRate.maxBpm - d.heartRate.minBpm] : []))
  return spans.length ? `${Math.max(...spans)} bpm` : EMPTY
})
</script>
