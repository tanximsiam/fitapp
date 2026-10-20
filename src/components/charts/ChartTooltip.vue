<template>
  <div
    class="pointer-events-none absolute z-10 min-w-36 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-[0_4px_16px_rgb(0_0_0/0.10)]"
    :style="{ left: `${x}px`, top: `${y}px`, transform: `translate(${shiftX}, -100%)` }"
    role="status"
  >
    <p class="mb-1 font-medium text-ink">{{ title }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ title: string; x: number; y: number; containerWidth: number }>()
// Keep the tooltip inside the chart near the edges.
const shiftX = computed(() => (props.x < 80 ? '-10%' : props.x > props.containerWidth - 80 ? '-90%' : '-50%'))
</script>
