<template>
  <!--
    Tab bar icons: chunky, rounded, minimal. Outline by default; filled in the current colour when selected,
    with the one inner detail cut out in the bar's surface colour.
  -->
  <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" class="tab-icon">
    <g stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" :fill="filled ? 'currentColor' : 'none'">
      <path :d="SHAPES[name]" />
    </g>
    <path v-if="DETAILS[name]" :d="DETAILS[name]" fill="none" :stroke="filled ? 'var(--surface)' : 'currentColor'" stroke-width="1.9" stroke-linecap="round" />
  </svg>
</template>

<script setup lang="ts">
export type TabIconName = 'home' | 'health' | 'journal' | 'insights'

defineProps<{ name: TabIconName; filled?: boolean }>()

const SHAPES: Record<TabIconName, string> = {
  // Rounded pentagon house.
  home: 'M12 3.6 19.6 9.2 17 19.6H7L4.4 9.2Z',
  // Plain rounded heart.
  health: 'M12 19.6S4.4 15.2 4.4 9.4A3.9 3.9 0 0 1 12 7.6a3.9 3.9 0 0 1 7.6 1.8c0 5.8-7.6 10.2-7.6 10.2Z',
  // Notebook.
  journal: 'M7.5 3.8h9a2.7 2.7 0 0 1 2.7 2.7v11a2.7 2.7 0 0 1-2.7 2.7h-9a2.7 2.7 0 0 1-2.7-2.7v-11a2.7 2.7 0 0 1 2.7-2.7Z',
  // Four-point spark.
  insights: 'M12 3.8c.7 4.3 3.9 7.5 8.2 8.2-4.3.7-7.5 3.9-8.2 8.2-.7-4.3-3.9-7.5-8.2-8.2 4.3-.7 7.5-3.9 8.2-8.2Z',
}

/** At most one small inner mark per icon. */
const DETAILS: Partial<Record<TabIconName, string>> = {
  home: 'M10.4 15.4h3.2',
  journal: 'M9.4 8.8h5.2',
}
</script>
