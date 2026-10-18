<template>
  <LoadingBlock v-if="!journal.loaded && !journal.error" />
  <StatePanel v-else-if="journal.error && !journal.loaded" kind="error" title="Your entries could not be loaded">
    {{ journal.error }}
    <template #actions>
      <button type="button" class="rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-sm font-medium" @click="journal.load()">Try again</button>
    </template>
  </StatePanel>
  <template v-else>
    <p v-if="journal.error" role="alert" class="mb-4 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
      {{ journal.error }} <button type="button" class="ml-2 underline underline-offset-2" @click="journal.load()">Retry</button>
    </p>
    <slot />
  </template>
</template>

<script setup lang="ts">
import LoadingBlock from '@/components/LoadingBlock.vue'
import StatePanel from '@/components/StatePanel.vue'
import { useJournalStore } from '@/stores/journal'

const journal = useJournalStore()
</script>
