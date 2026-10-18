<template>
  <div>
    <div v-if="parts.length" class="flex h-3 w-full gap-0.5 overflow-hidden rounded-full" role="img" :aria-label="summary">
      <div v-for="p in parts" :key="p.key" :style="{ flexGrow: p.minutes, background: p.color }" />
    </div>
    <ul class="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
      <li v-for="s in SLEEP_STAGES" :key="s.key" class="flex items-center gap-2">
        <span class="size-2.5 shrink-0 rounded-sm" :style="{ background: s.color }" aria-hidden="true" />
        <span class="text-ink-2">{{ s.label }}</span>
        <span class="tabular ml-auto whitespace-nowrap font-medium">{{ formatDuration(stages?.[s.key] ?? null) }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDuration } from '@/lib/format'
import { SLEEP_STAGES } from '@/components/sleepStages'
import type { SleepStages } from '@/types/fitness'

const props = defineProps<{ stages: SleepStages | null }>()

// Bar order follows the night's depth: deep at the left, awake at the right.
const parts = computed(() =>
  [...SLEEP_STAGES]
    .reverse()
    .map((s) => ({ ...s, minutes: props.stages?.[s.key] ?? 0 }))
    .filter((p) => p.minutes > 0),
)
const summary = computed(() => parts.value.map((p) => `${p.label} ${formatDuration(p.minutes)}`).join(', '))
</script>
