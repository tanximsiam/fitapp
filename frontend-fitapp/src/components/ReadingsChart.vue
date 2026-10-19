<template>
  <div v-if="loading && !readings.length" :style="{ height: `${height}px` }" class="animate-pulse rounded-lg bg-line/60" aria-busy="true" aria-label="Loading readings" />
  <StatePanel v-else-if="error" kind="error" title="Readings could not be loaded">
    {{ error }}
    <template #actions><PrimaryButton variant="secondary" label="Try again" @click="emit('retry')" /></template>
  </StatePanel>
  <p v-else-if="!readings.length" class="py-8 text-center text-sm text-muted">{{ emptyText }}</p>
  <LineChart
    v-else
    :points="points"
    :x-domain="domain"
    :x-ticks="ticks"
    :max-gap="maxGap"
    :y-domain="yDomain"
    :height="height"
    :color="color"
    :unit="unit"
    x-name="Time"
    :description="description"
  >
    <template v-if="legend" #legend>
      <span class="flex items-center gap-1.5"><span class="h-0.5 w-3.5 rounded-full" :style="{ background: color }" aria-hidden="true" />{{ legend }}</span>
    </template>
  </LineChart>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LineChart from '@/components/charts/LineChart.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import StatePanel from '@/components/StatePanel.vue'
import { wallMinutes } from '@/lib/dates'
import { formatClock } from '@/lib/format'
import type { Reading } from '@/types/fitness'

const props = withDefaults(
  defineProps<{
    readings: Reading[]
    loading: boolean
    error: string | null
    color: string
    unit: string
    description: string
    emptyText: string
    yDomain?: [number, number]
    /** Readings further apart than this (minutes) are not joined. */
    maxGap?: number
    /** Show only the hours that have readings (e.g. overnight SpO₂) instead of the whole day. */
    fitToReadings?: boolean
    height?: number
    /** One-line legend under the chart. */
    legend?: string
  }>(),
  { yDomain: undefined, maxGap: 45, fitToReadings: false, height: 200, legend: undefined },
)
const emit = defineEmits<{ retry: [] }>()

const points = computed(() => props.readings.map((r) => ({ x: wallMinutes(r.at), label: formatClock(r.at), value: r.value })))
const domain = computed<[number, number]>(() => {
  if (!props.fitToReadings || !points.value.length) return [0, 1440]
  const xs = points.value.map((p) => p.x)
  return [Math.floor(Math.min(...xs) / 60) * 60, Math.ceil((Math.max(...xs) + 1) / 60) * 60]
})
const ticks = computed(() => {
  const [lo, hi] = domain.value
  const step = hi - lo <= 12 * 60 ? 120 : 360
  const out = []
  for (let m = lo; m <= hi; m += step) out.push({ value: m, label: `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:00` })
  return out
})
</script>
