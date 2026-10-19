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
        @keydown="onKeydown"
        @focus="active ??= selectedIndex >= 0 ? selectedIndex : bars.length - 1"
        @blur="active = null"
      >
        <!-- grid & axis -->
        <g class="text-[11px]" fill="var(--muted)">
          <g v-for="t in ticks" :key="t">
            <line :x1="padL" :x2="width" :y1="y(t)" :y2="y(t)" :stroke="t === 0 ? 'var(--line-strong)' : 'var(--grid)'" stroke-width="1" />
            <text :x="padL - 8" :y="y(t) + 4" text-anchor="end" class="tabular">{{ formatTick(t) }}</text>
          </g>
        </g>

        <!-- bars -->
        <g v-for="(bar, i) in bars" :key="bar.key">
          <template v-if="bar.segments">
            <path
              v-for="(seg, j) in stack(bar.segments)"
              :key="j"
              :d="roundedTop(cx(i) - barW / 2, seg.top, barW, seg.height, j === bar.segments.length - 1)"
              :fill="seg.color"
              :opacity="active !== null && active !== i ? 0.55 : 1"
              class="transition-opacity duration-150"
            />
          </template>
          <rect
            v-else
            :x="cx(i) - barW / 2"
            :y="baseline - 6"
            :width="barW"
            height="6"
            rx="2"
            fill="none"
            stroke="var(--line-strong)"
            stroke-dasharray="2 2"
          />
          <text
            v-if="i % labelEvery === labelOffset || i === selectedIndex"
            :x="cx(i)"
            :y="height - 6"
            text-anchor="middle"
            class="text-[11px]"
            :fill="i === selectedIndex ? 'var(--ink)' : 'var(--muted)'"
            :font-weight="i === selectedIndex ? 600 : 400"
          >{{ bar.label }}</text>
          <rect v-if="i === selectedIndex" :x="cx(i) - barW / 2" :y="baseline + 3" :width="barW" height="2" rx="1" fill="var(--accent)" />
          <!-- hit target wider than the mark -->
          <rect
            :x="padL + i * slot"
            :y="0"
            :width="slot"
            :height="baseline"
            fill="transparent"
            class="cursor-pointer"
            @pointerenter="active = i"
            @click="emit('select', bar.key)"
          />
        </g>

        <g v-if="goal" pointer-events="none">
          <line :x1="padL" :x2="width" :y1="y(goal)" :y2="y(goal)" stroke="var(--ink-2)" stroke-dasharray="4 3" stroke-width="1" />
        </g>
      </svg>

      <ChartTooltip v-if="active !== null && bars[active]" :title="bars[active].title" :x="cx(active)" :y="tooltipY(active)" :container-width="width">
        <template v-if="bars[active].segments">
          <p v-for="seg in (bars[active].segments ?? []).filter((s) => s.name)" :key="seg.name" class="flex items-center justify-between gap-4 text-ink-2">
            <span class="flex items-center gap-1.5"><span class="size-2 rounded-sm" :style="{ background: seg.color }" />{{ seg.name }}</span>
            <span class="tabular">{{ seg.valueText }}</span>
          </p>
          <p class="tabular text-ink">{{ bars[active].valueText }}</p>
        </template>
        <p v-else class="text-muted">No data recorded</p>
      </ChartTooltip>
    </div>

    <figcaption v-if="table || goal || $slots.legend" class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      <slot name="legend" />
      <span v-if="goal" class="flex items-center gap-1.5"><svg width="16" height="2" aria-hidden="true"><line x1="0" x2="16" y1="1" y2="1" stroke="var(--ink-2)" stroke-dasharray="4 3" /></svg>{{ goalLabel }}</span>
      <details v-if="table" class="ml-auto">
        <summary class="cursor-pointer select-none hover:text-ink">Data table</summary>
        <table class="mt-2 w-full min-w-56 text-left text-xs">
          <thead><tr class="text-muted"><th class="py-1 pr-4 font-medium">Date</th><th class="py-1 font-medium">{{ valueName }}</th></tr></thead>
          <tbody>
            <tr v-for="bar in bars" :key="bar.key" class="border-t border-line text-ink-2">
              <td class="py-1 pr-4">{{ bar.title }}</td>
              <td class="py-1">{{ bar.segments ? bar.valueText : 'No data' }}</td>
            </tr>
          </tbody>
        </table>
      </details>
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useElementWidth } from '@/composables/useElementWidth'
import ChartTooltip from './ChartTooltip.vue'
import { compactNumber, niceMax } from './scale'

export interface BarSegment {
  value: number
  color: string
  /** Shown in the tooltip when the bar is stacked. */
  name?: string
  valueText?: string
}

export interface Bar {
  key: string
  label: string
  title: string
  /** null = no measurement (drawn as an empty placeholder, never as zero). */
  segments: BarSegment[] | null
  valueText: string
}

const props = withDefaults(
  defineProps<{
    bars: Bar[]
    description: string
    valueName: string
    selectedKey?: string
    goal?: number
    goalLabel?: string
    height?: number
    formatTick?: (n: number) => string
    /** Off in compact widgets; detail pages keep the table. */
    table?: boolean
  }>(),
  { height: 220, formatTick: compactNumber, selectedKey: undefined, goal: undefined, goalLabel: '', table: true },
)
const emit = defineEmits<{ select: [key: string] }>()

const box = ref<HTMLElement | null>(null)
const width = useElementWidth(box)
const active = ref<number | null>(null)

const padL = 40
const padB = 26
const baseline = computed(() => props.height - padB)
const slot = computed(() => (width.value - padL) / Math.max(props.bars.length, 1))
const barW = computed(() => Math.max(3, Math.min(slot.value * 0.62, 28)))
const total = (segs: BarSegment[] | null) => (segs ?? []).reduce((a, s) => a + s.value, 0)
const max = computed(() => niceMax(Math.max(props.goal ?? 0, ...props.bars.map((b) => total(b.segments))) * 1.05))
const ticks = computed(() => [0, max.value / 2, max.value])
const labelEvery = computed(() => Math.max(1, Math.ceil(props.bars.length / Math.max(1, (width.value - padL) / 44))))
// Anchor sparse labels to the most recent bar.
const labelOffset = computed(() => (props.bars.length - 1) % labelEvery.value)
const selectedIndex = computed(() => props.bars.findIndex((b) => b.key === props.selectedKey))

const y = (v: number) => 8 + (baseline.value - 8) * (1 - v / max.value)
const cx = (i: number) => padL + slot.value * (i + 0.5)
const tooltipY = (i: number) => Math.max(y(total(props.bars[i].segments)) - 8, 40)

/** Segment rectangles bottom-up with a 2px surface gap between fills. */
function stack(segs: BarSegment[]) {
  let acc = 0
  return segs.map((s) => {
    const top = y(acc + s.value)
    const bottom = y(acc)
    acc += s.value
    return { color: s.color, top, height: Math.max(0, bottom - top - (acc > s.value ? 2 : 0)) }
  })
}

/** Rect with a fully rounded data-end (top) only. */
function roundedTop(x: number, top: number, w: number, h: number, rounded: boolean) {
  if (h <= 0) return ''
  const r = rounded ? Math.min(w / 2, h) : 0
  return `M${x},${top + h}V${top + r}Q${x},${top} ${x + r},${top}H${x + w - r}Q${x + w},${top} ${x + w},${top + r}V${top + h}Z`
}

function onKeydown(e: KeyboardEvent) {
  const n = props.bars.length
  if (!n) return
  const current = active.value ?? n - 1
  if (e.key === 'ArrowLeft') active.value = Math.max(0, current - 1)
  else if (e.key === 'ArrowRight') active.value = Math.min(n - 1, current + 1)
  else if (e.key === 'Home') active.value = 0
  else if (e.key === 'End') active.value = n - 1
  else if (e.key === 'Enter' || e.key === ' ') emit('select', props.bars[current].key)
  else return
  e.preventDefault()
}
</script>
