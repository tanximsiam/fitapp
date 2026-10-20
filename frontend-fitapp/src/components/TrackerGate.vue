<template>
  <slot v-if="!journal.loaded || journal.prefs[tracker]" />
  <StatePanel v-else kind="empty" :title="`The ${names[tracker]} tracker is turned off`">
    Trackers are turned on and off in the FitApp mobile app. Entries are kept while a tracker is off.
  </StatePanel>
</template>

<script setup lang="ts">
import StatePanel from '@/components/StatePanel.vue'
import { useJournalStore } from '@/stores/journal'
import type { TrackerPrefs } from '@/types/journal'

defineProps<{ tracker: keyof TrackerPrefs }>()
const journal = useJournalStore()
const names: Record<keyof TrackerPrefs, string> = { mood: 'mood', food: 'food', cycle: 'cycle' }
</script>
