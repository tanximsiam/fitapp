<template>
  <div class="min-w-0">
    <div class="flex items-baseline justify-between gap-3">
      <span class="text-sm text-ink-2">{{ label }}</span>
      <span class="text-xs text-muted">{{ ratio === null ? 'Not measured' : `${Math.round(ratio * 100)}% of ${goalText}` }}</span>
    </div>
    <p class="tabular mt-1 text-2xl font-semibold tracking-tight" :class="ratio === null ? 'text-muted' : ''">{{ valueText }}</p>
    <div
      class="mt-2 h-1.5 overflow-hidden rounded-full bg-line"
      role="meter"
      :aria-label="`${label} goal progress`"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="ratio === null ? undefined : Math.min(100, Math.round(ratio * 100))"
      :aria-valuetext="ratio === null ? 'Not measured' : `${Math.round(ratio * 100)}% of ${goalText}`"
    >
      <div v-if="ratio !== null" class="h-full rounded-full transition-[width] duration-300 ease-out" :style="{ width: `${Math.min(100, ratio * 100)}%`, background: color }" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; valueText: string; goalText: string; ratio: number | null; color: string }>()
</script>
