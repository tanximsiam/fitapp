<template>
  <span class="inline-flex shrink-0 items-center rounded-full border px-1.5 py-px text-[10px] font-medium uppercase tracking-wide" :class="cls">{{ text }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/** Where a value came from: the watch or the person's own entry (sample data reads the same). */
const props = defineProps<{ kind: 'watch' | 'simulated-watch' | 'manual' | 'simulated' }>()
const text = computed(() => ({ watch: 'Watch', 'simulated-watch': 'Watch', manual: 'You logged', simulated: 'You logged' })[props.kind])
const cls = computed(() => (props.kind === 'watch' || props.kind === 'simulated-watch' ? 'border-activity/40 text-activity' : 'border-line-strong text-ink-2'))
</script>
