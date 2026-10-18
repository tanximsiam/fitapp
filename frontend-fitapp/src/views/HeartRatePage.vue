<template>
  <AppShell title="Heart rate">
    <template #subtitle>{{ formatLongDate(fitness.selectedDate) }} · {{ freshness }}</template>
    <DateToolbar />

    <DataState>
      <div class="grid gap-4">
        <p v-if="fitness.status?.latestHeartRate" class="text-sm text-ink-2">
          Latest reading
          <span class="tabular text-lg font-semibold text-ink">{{ fitness.status.latestHeartRate.bpm }} bpm</span>
          at {{ formatClock(fitness.status.latestHeartRate.at) }} on {{ formatLongDate(fitness.status.latestHeartRate.at.slice(0, 10)) }}
          <span class="text-xs text-muted">(last value uploaded by the watch, not live)</span>
        </p>
        <PanelSection title="Through the day">
          <template #aside>
            <p v-if="samples.length" class="text-xs text-muted">{{ samples.length }} readings</p>
          </template>
          <dl class="mb-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            <MetricItem label="Resting" :icon="ICONS.heartRate" :value="bpm(hr?.restingBpm)" />
            <MetricItem label="Average" :value="bpm(hr?.avgBpm)" />
            <MetricItem label="Lowest" :value="bpm(hr?.minBpm)" />
            <MetricItem label="Highest" :value="bpm(hr?.maxBpm)" />
          </dl>

          <div v-if="samplesLoading && !samples.length" class="h-[200px] animate-pulse rounded-lg bg-line/60" aria-busy="true" aria-label="Loading readings" />
          <StatePanel v-else-if="samplesError" kind="error" title="Readings could not be loaded">
            {{ samplesError }}
            <template #actions>
              <button type="button" class="rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-sm font-medium" @click="loadSamples">Try again</button>
            </template>
          </StatePanel>
          <p v-else-if="!samples.length" class="py-8 text-center text-sm text-muted">No heart-rate readings were recorded on this day.</p>
          <LineChart
            v-else
            :points="samplePoints"
            :x-domain="[0, 1440]"
            :x-ticks="HOUR_TICKS"
            :max-gap="30"
            color="var(--heart)"
            unit="bpm"
            x-name="Time"
            description="Heart rate readings through the day. Use arrow keys to step through readings."
          />
        </PanelSection>

        <PanelSection :title="`Resting heart rate, last ${fitness.rangeDays} days`">
          <dl class="mb-5 grid grid-cols-3 gap-4">
            <MetricItem label="Average" :value="bpm(restingAvg)" />
            <MetricItem label="Lowest" :value="bpm(restingValues.length ? Math.min(...restingValues) : null)" />
            <MetricItem label="Highest" :value="bpm(restingValues.length ? Math.max(...restingValues) : null)" />
          </dl>
          <LineChart
            :points="dailyLine(rangeDaysList, (d) => d.heartRate?.restingBpm)"
            :x-domain="[0, Math.max(1, rangeDaysList.length - 1)]"
            :x-ticks="dailyTicks(rangeDaysList)"
            :mark-x="rangeDaysList.length - 1"
            color="var(--heart)"
            unit="bpm"
            x-name="Date"
            description="Resting heart rate by day"
          />
        </PanelSection>
      </div>
    </DataState>
  </AppShell>
</template>

<script setup lang="ts">
import { ICONS } from '@/components/metricIcons'
import { computed, ref, watch } from 'vue'
import AppShell from '@/components/AppShell.vue'
import LineChart from '@/components/charts/LineChart.vue'
import DataState from '@/components/DataState.vue'
import DateToolbar from '@/components/DateToolbar.vue'
import MetricItem from '@/components/MetricItem.vue'
import PanelSection from '@/components/PanelSection.vue'
import StatePanel from '@/components/StatePanel.vue'
import { errorMessage } from '@/api/client'
import { useFitnessData } from '@/composables/useFitnessData'
import { dailyLine, dailyTicks } from '@/data/chartData'
import { mean } from '@/data/derive'
import { wallMinutes } from '@/lib/dates'
import { EMPTY, formatClock, formatLongDate } from '@/lib/format'
import type { HeartRateSample } from '@/types/fitness'

const { fitness, mode, freshness, rangeDaysList, selectedDay } = useFitnessData()

const HOUR_TICKS = [0, 6, 12, 18, 24].map((h) => ({ value: h * 60, label: `${String(h).padStart(2, '0')}:00` }))
const bpm = (n: number | null | undefined) => (n == null ? EMPTY : `${Math.round(n)} bpm`)

const hr = computed(() => selectedDay.value?.heartRate ?? null)
const restingValues = computed(() => rangeDaysList.value.map((d) => d.heartRate?.restingBpm).filter((v): v is number => v != null))
const restingAvg = computed(() => mean(restingValues.value))

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
</script>
