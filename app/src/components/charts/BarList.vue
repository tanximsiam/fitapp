<template>
  <!-- Horizontal bars for a ranked or categorical list (emotions, zones, distributions). -->
  <ul class="flex flex-col gap-2.5" :class="height ? 'justify-between' : ''" :style="height ? { height: `${height}px` } : undefined" :aria-label="description">
    <li v-for="r in rows" :key="r.label" class="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_auto] items-center gap-3 text-sm">
      <span class="truncate text-ink-2 first-letter:uppercase">{{ r.label }}</span>
      <span class="h-2.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <span class="block h-full rounded-full transition-[width] duration-500 ease-out" :style="{ width: `${max ? (r.value / max) * 100 : 0}%`, background: r.color ?? color }" />
      </span>
      <span class="tabular text-right text-xs font-medium">{{ r.valueText ?? r.value }}</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface BarListRow {
  label: string
  value: number
  valueText?: string
  color?: string
}

const props = withDefaults(defineProps<{ rows: BarListRow[]; color?: string; description: string; scaleMax?: number; height?: number }>(), {
  color: 'var(--accent)',
  scaleMax: undefined,
  height: undefined,
})
const max = computed(() => props.scaleMax ?? Math.max(0, ...props.rows.map((r) => r.value)))
</script>
