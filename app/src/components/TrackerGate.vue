<template>
  <slot v-if="!journal.loaded || journal.prefs[tracker]" />
  <StatePanel v-else kind="empty" :title="`The ${names[tracker]} tracker is turned off`">
    Turn it on to record entries here. Trackers are optional and can be switched off again at any time; existing entries are kept.
    <template #actions>
      <PrimaryButton :label="`Turn on ${names[tracker]} tracking`" @click="enable" />
    </template>
  </StatePanel>
</template>

<script setup lang="ts">
import PrimaryButton from '@/components/PrimaryButton.vue'
import StatePanel from '@/components/StatePanel.vue'
import { useJournalStore } from '@/stores/journal'
import type { TrackerPrefs } from '@/types/journal'

const props = defineProps<{ tracker: keyof TrackerPrefs }>()
const journal = useJournalStore()
const names: Record<keyof TrackerPrefs, string> = { mood: 'mood', food: 'food', cycle: 'period' }
const enable = () => journal.savePrefs({ ...journal.prefs, [props.tracker]: true })
</script>
