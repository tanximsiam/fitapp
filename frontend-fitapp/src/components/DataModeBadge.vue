<template>
  <!-- Only sample data gets a note; a signed-in account needs no label. -->
  <RouterLink
    v-if="mode.isDemo"
    to="/settings"
    class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150 border-accent/30 bg-accent-soft text-ink hover:border-accent/60"
    title="Example data. Sign in from Settings to see your own."
  >
    <span class="size-1.5 rounded-full bg-accent" aria-hidden="true" />
    Sample data
  </RouterLink>
</template>

<script setup lang="ts">
import { useModeStore } from '@/stores/mode'

const mode = useModeStore()
</script>
