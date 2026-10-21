<template>
  <span class="inline-flex shrink-0 items-center rounded-full border px-1.5 py-px text-[10px] font-medium uppercase tracking-wide" :class="cls">{{ text }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * Where a value came from: the watch or the user's own entry (sample data reads the same);
 * or, for an entry made on this phone, that the server does not have it yet.
 */
export type EntryBadgeKind = 'watch' | 'simulated-watch' | 'manual' | 'simulated' | 'pending' | 'conflict' | 'rejected'
const props = defineProps<{ kind: EntryBadgeKind }>()
const text = computed(
  () =>
    ({
      watch: 'Watch',
      'simulated-watch': 'Watch',
      manual: 'You logged',
      simulated: 'You logged',
      pending: 'Waiting to sync',
      conflict: 'Needs review',
      rejected: 'Not saved',
    })[props.kind],
)
const cls = computed(() => {
  // The ink shade, not the chart blue: 10px text needs 4.5:1 on cards in both themes.
  if (props.kind === 'watch' || props.kind === 'simulated-watch') return 'border-activity/40 text-[var(--activity-ink)]'
  if (props.kind === 'conflict' || props.kind === 'rejected') return 'border-danger/40 text-danger'
  if (props.kind === 'pending') return 'border-dashed border-line-strong text-ink-2'
  return 'border-line-strong text-ink-2'
})
</script>
