<template>
  <slot v-if="!journal.loaded || list.some((t) => journal.prefs[t])" />
  <StatePanel v-else kind="empty" :title="`The ${names[list[0]]} tracker is turned off`">
    Turn it on to record entries here. Trackers are optional and can be switched off again at any time; existing entries are kept.
    <template #actions>
      <PrimaryButton :label="`Turn on ${names[list[0]]} tracking`" @click="enable" />
    </template>
  </StatePanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import StatePanel from '@/components/StatePanel.vue'
import { useJournalStore } from '@/stores/journal'
import type { TrackerPrefs } from '@/types/journal'

/** One tracker, or several when a page serves more than one (shown if any is on). */
const props = defineProps<{ tracker: keyof TrackerPrefs | (keyof TrackerPrefs)[] }>()
const journal = useJournalStore()
const list = computed(() => [props.tracker].flat())
const names: Record<keyof TrackerPrefs, string> = { mood: 'mood', food: 'food', hydration: 'hydration', cycle: 'period' }
const enable = () => journal.savePrefs({ ...journal.prefs, [list.value[0]]: true })
</script>
