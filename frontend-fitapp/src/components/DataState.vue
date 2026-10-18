<template>
  <LoadingBlock v-if="!fitness.loaded && !fitness.error" />

  <StatePanel v-else-if="fitness.error && !fitness.loaded" kind="error" title="Your data could not be loaded">
    {{ fitness.error }}
    <template #actions>
      <button type="button" :class="buttonClass" @click="fitness.load()">Try again</button>
      <RouterLink to="/settings" :class="buttonClass">Open settings</RouterLink>
    </template>
  </StatePanel>

  <StatePanel v-else-if="!mode.isDemo && fitness.status && !fitness.status.sources.length" kind="empty" title="No data has been uploaded yet">
    Your backend is connected, but no source has sent data. Create an ingest token in Settings and send your data to
    <code class="rounded bg-page px-1 text-xs">POST /api/ingest</code> using the documented payload.
    <template #actions>
      <RouterLink to="/settings" :class="buttonClass">Set up a data source</RouterLink>
    </template>
  </StatePanel>

  <template v-else>
    <p v-if="fitness.error" role="alert" class="mb-4 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
      {{ fitness.error }}
      <button type="button" class="ml-2 underline underline-offset-2" @click="fitness.load()">Retry</button>
    </p>
    <slot />
  </template>
</template>

<script setup lang="ts">
import LoadingBlock from '@/components/LoadingBlock.vue'
import StatePanel from '@/components/StatePanel.vue'
import { useFitnessStore } from '@/stores/fitness'
import { useModeStore } from '@/stores/mode'

const fitness = useFitnessStore()
const mode = useModeStore()
const buttonClass =
  'inline-flex items-center rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-sm font-medium text-ink transition-colors duration-150 hover:border-ink-2'
</script>
