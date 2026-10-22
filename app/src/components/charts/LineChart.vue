<template>
  <figure class="m-0">
    <div ref="box" class="relative [contain:inline-size]" @pointerleave="active = null">
      <svg
        :width="width"
        :height="height"
        class="block touch-pan-y select-none outline-none"
        role="img"
        :aria-label="description"
        tabindex="0"
        @pointermove="onPointer"
        @pointerdown="onPointer"
        @keydown="onKeydown"
        @focus="active ??= lastMeasured"
        @blur="active = null"
      >
        <g class="text-[11px]" fill="var(--muted)">
          <g v-for="t in yTicks" :key="t">
            <line :x1="padL" :x2="width" :y1="y(t)" :y2="y(t)" stroke="var(--grid)" stroke-width="1" />
            <text :x="padL - 8" :y="y(t) + 4" text-anchor="end" class="tabular">{{ formatY(t) }}</text>
          </g>
          <text v-for="t in xTicks" :key="t.value" :x="x(t.value)" :y="height - 6" :text-anchor="x(t.value) > width - 24 ? 'end' : 'middle'">{{ t.label }}</text>
        </g>

        <line v-if="markX !== undefined" :x1="x(markX)" :x2="x(markX)" :y1="8" :y2="baseline" stroke="var(--accent)" stroke-width="1" stroke-dasharray="3 3" />

        <path :d="path" fill="none" :stroke="color" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
        <circle
          v-for="(p, i) in isolated"
          :key="i"
          :cx="x(p.x)"
          :cy="y(p.value as number)"
          r="2.5"
          :fill="color"
        />

        <g v-if="activePoint && activePoint.value !== null" pointer-events="none">
          <line :x1="x(activePoint.x)" :x2="x(activePoint.x)" :y1="8" :y2="baseline" stroke="var(--line-strong)" stroke-width="1" />
          <circle :cx="x(activePoint.x)" :cy="y(activePoint.value)" r="5" :fill="color" stroke="var(--surface)" stroke-width="2" />
        </g>
      </svg>

      <ChartTooltip
        v-if="activePoint"
        :title="activePoint.label"
        :x="x(activePoint.x)"
        :y="activePoint.value === null ? 40 : Math.max(y(activePoint.value) - 10, 40)"
        :container-width="width"
      >
        <p class="tabular text-ink">{{ activePoint.value === null ? 'No data recorded' : `${activePoint.value} ${unit}` }}</p>
      </ChartTooltip>
    </div>

    <figcaption v-if="table || $slots.legend" class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      <slot name="legend" />
      <details v-if="table" class="ml-auto [&[open]]:ml-0 [&[open]]:basis-full">
        <summary class="ml-auto block w-fit cursor-pointer select-none hover:text-ink">Data table</summary>
        <div class="max-h-64 overflow-auto">
          <table class="mt-2 w-full min-w-56 text-left text-xs">
            <thead><tr class="text-muted"><th class="py-1 pr-4 font-medium">{{ xName }}</th><th class="py-1 font-medium">{{ unit }}</th></tr></thead>
            <tbody>
              <tr v-for="p in points" :key="p.x" class="border-t border-line text-ink-2">
                <td class="py-1 pr-4">{{ p.label }}</td>
                <td class="py-1">{{ p.value ?? 'No data' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useElementWidth } from '@/composables/useElementWidth'
import ChartTooltip from './ChartTooltip.vue'

export interface LinePoint {
  x: number
  label: string
  value: number | null
}

const props = withDefaults(
  defineProps<{
    points: LinePoint[]
    xDomain: [number, number]
    xTicks: { value: number; label: string }[]
    description: string
    unit: string
    xName: string
    color: string
    /** Points further apart than this on x are not joined (sensor gaps). */
    maxGap?: number
    markX?: number
    height?: number
    table?: boolean
    /** Fixed y range for bounded scales (e.g. 1–5); otherwise fitted to the data. */
    yDomain?: [number, number]
    formatY?: (n: number) => string
  }>(),
  { maxGap: Infinity, markX: undefined, height: 200, table: true, yDomain: undefined, formatY: (n: number) => String(Math.round(n)) },
)

const box = ref<HTMLElement | null>(null)
const width = useElementWidth(box)
const active = ref<number | null>(null)

const padL = 36
const padR = 12
const baseline = computed(() => props.height - 26)
const measured = computed(() => props.points.filter((p) => p.value !== null) as (LinePoint & { value: number })[])
const yRange = computed(() => {
  if (props.yDomain) return props.yDomain
  const vals = measured.value.map((p) => p.value)
  if (!vals.length) return [40, 100]
  const min = Math.min(...vals)
  const lo = min >= 0 ? Math.max(0, Math.floor((min - 4) / 10) * 10) : Math.floor((min - 4) / 10) * 10
  const hi = Math.ceil((Math.max(...vals) + 4) / 10) * 10
  return [lo, Math.max(hi, lo + 20)]
})
const yTicks = computed(() => {
  const [lo, hi] = yRange.value
  return [lo, (lo + hi) / 2, hi]
})

const x = (v: number) => padL + ((v - props.xDomain[0]) / (props.xDomain[1] - props.xDomain[0] || 1)) * (width.value - padL - padR)
const y = (v: number) => 8 + (baseline.value - 8) * (1 - (v - yRange.value[0]) / (yRange.value[1] - yRange.value[0]))

/** Segments of consecutive measured points; nulls and long gaps break the line. */
const segments = computed(() => {
  const out: (LinePoint & { value: number })[][] = []
  let run: (LinePoint & { value: number })[] = []
  for (const p of props.points) {
    const prev = run[run.length - 1]
    if (p.value === null || (prev && p.x - prev.x > props.maxGap)) {
      if (run.length) out.push(run)
      run = []
    }
    if (p.value !== null) run.push(p as LinePoint & { value: number })
  }
  if (run.length) out.push(run)
  return out
})
const path = computed(() =>
  segments.value
    .filter((s) => s.length > 1)
    .map((s) => s.map((p, i) => `${i ? 'L' : 'M'}${x(p.x).toFixed(1)},${y(p.value).toFixed(1)}`).join(''))
    .join(''),
)
const isolated = computed(() => segments.value.filter((s) => s.length === 1).map((s) => s[0]))

const activePoint = computed(() => (active.value === null ? null : props.points[active.value] ?? null))
const lastMeasured = computed(() => {
  for (let i = props.points.length - 1; i >= 0; i--) if (props.points[i].value !== null) return i
  return props.points.length - 1
})

function onPointer(e: PointerEvent) {
  if (!props.points.length) return
  const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
  const px = e.clientX - rect.left
  let best = 0
  for (let i = 1; i < props.points.length; i++) {
    if (Math.abs(x(props.points[i].x) - px) < Math.abs(x(props.points[best].x) - px)) best = i
  }
  active.value = best
}

function onKeydown(e: KeyboardEvent) {
  const n = props.points.length
  if (!n) return
  const current = active.value ?? lastMeasured.value
  if (e.key === 'ArrowLeft') active.value = Math.max(0, current - 1)
  else if (e.key === 'ArrowRight') active.value = Math.min(n - 1, current + 1)
  else if (e.key === 'Home') active.value = 0
  else if (e.key === 'End') active.value = n - 1
  else return
  e.preventDefault()
}
</script>
