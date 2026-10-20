<template>
  <!-- Parts of a whole (e.g. a day's macronutrients), with the total in the middle and a legend beside it. -->
  <figure class="m-0 flex items-center gap-5" :style="height ? { height: `${height}px` } : undefined">
    <div class="relative size-32 shrink-0">
      <svg viewBox="0 0 120 120" class="size-full -rotate-90" role="img" :aria-label="description">
        <circle cx="60" cy="60" :r="R" fill="none" stroke="var(--line)" stroke-width="16" />
        <circle
          v-for="s in arcs"
          :key="s.label"
          cx="60"
          cy="60"
          :r="R"
          fill="none"
          :stroke="s.color"
          stroke-width="16"
          :stroke-dasharray="`${s.len} ${CIRC - s.len}`"
          :stroke-dashoffset="-s.offset"
        />
      </svg>
      <div class="absolute inset-0 grid place-content-center text-center">
        <span class="tabular text-lg leading-tight font-semibold">{{ centerValue }}</span>
        <span class="text-[11px] text-muted">{{ centerLabel }}</span>
      </div>
    </div>
    <figcaption class="grid min-w-0 flex-1 gap-2 text-sm">
      <p v-for="s in arcs" :key="s.label" class="flex items-center gap-2">
        <span class="size-2.5 shrink-0 rounded-sm" :style="{ background: s.color }" aria-hidden="true" />
        <span class="text-ink-2">{{ s.label }}</span>
        <span class="tabular ml-auto font-medium">{{ s.valueText }}</span>
        <span class="tabular w-10 text-right text-xs text-muted">{{ Math.round(s.share * 100) }}%</span>
      </p>
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface DonutPart {
  label: string
  value: number
  valueText: string
  color: string
}

const props = defineProps<{ parts: DonutPart[]; centerValue: string; centerLabel: string; description: string; /** Fills a widget's chart area. */ height?: number }>()
const R = 50
const CIRC = 2 * Math.PI * R
/** A 2px gap between segments keeps adjacent colours apart. */
const arcs = computed(() => {
  const total = props.parts.reduce((a, p) => a + p.value, 0)
  let offset = 0
  return props.parts.map((p) => {
    const share = total ? p.value / total : 0
    const len = Math.max(0, share * CIRC - (share > 0 && share < 1 ? 2 : 0))
    const arc = { ...p, share, len, offset }
    offset += share * CIRC
    return arc
  })
})
</script>
