<template>
  <!-- One dot per day: filled when the goal was met, ringed when not, dashed when nothing was measured. -->
  <figure class="m-0">
    <ol
      class="grid content-evenly gap-1.5"
      :style="{ gridTemplateColumns: `repeat(${Math.min(days.length, 7)}, minmax(0, 1fr))`, height: height ? `${height - 28}px` : undefined }"
      :aria-label="summary"
    >
      <li v-for="d in days" :key="d.key" class="flex flex-col items-center gap-1">
        <span
          class="grid size-8 place-items-center rounded-full text-[11px] font-medium"
          :class="d.state === 'none' ? 'border border-dashed border-line-strong text-muted' : d.state === 'met' ? 'text-white' : 'text-ink-2 ring-2 ring-inset'"
          :style="d.state === 'met' ? { background: color } : d.state === 'missed' ? { '--tw-ring-color': `color-mix(in srgb, ${color} 35%, transparent)` } : undefined"
          :title="d.title"
          aria-hidden="true"
        >
          {{ d.label }}
        </span>
      </li>
    </ol>
    <figcaption class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      <span class="flex items-center gap-1.5"><span class="size-2.5 rounded-full" :style="{ background: color }" aria-hidden="true" />{{ metLabel }}</span>
      <span class="flex items-center gap-1.5"><span class="size-2.5 rounded-full ring-2 ring-inset" :style="{ '--tw-ring-color': `color-mix(in srgb, ${color} 35%, transparent)` }" aria-hidden="true" />{{ missedLabel }}</span>
      <span class="ml-auto">{{ metCount }} of {{ measured }} days</span>
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface GoalDay {
  key: string
  /** Short label inside the dot (day of month). */
  label: string
  title: string
  state: 'met' | 'missed' | 'none'
}

const props = withDefaults(
  defineProps<{ days: GoalDay[]; color: string; what: string; /** Total height including the legend row. */ height?: number; metLabel?: string; missedLabel?: string }>(),
  { height: undefined, metLabel: 'Goal met', missedLabel: 'Not met' },
)
const metCount = computed(() => props.days.filter((d) => d.state === 'met').length)
const measured = computed(() => props.days.filter((d) => d.state !== 'none').length)
const summary = computed(() => `${props.what}: goal met on ${metCount.value} of ${measured.value} measured days`)
</script>
