<template>
  <RouterLink
    to="/settings"
    class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150"
    :class="mode.isDemo ? 'border-accent/30 bg-accent-soft text-ink hover:border-accent/60' : 'border-line bg-surface text-ink-2 hover:border-line-strong'"
    :title="mode.isDemo ? 'Generated sample data. Open settings to connect your own backend.' : 'Data from your FitApp backend'"
  >
    <span class="size-1.5 rounded-full" :class="mode.isDemo ? 'bg-accent' : 'bg-ink-2'" aria-hidden="true" />
    {{ mode.isDemo ? 'Sample data' : 'Your backend' }}
  </RouterLink>
</template>

<script setup lang="ts">
import { useModeStore } from '@/stores/mode'

const mode = useModeStore()
</script>
