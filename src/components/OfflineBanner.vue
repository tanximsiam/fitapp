<template>
  <!-- Live data only: says when the screen shows the saved copy and how many entries are still on this phone. -->
  <p v-if="text" role="status" class="mb-4 flex items-start gap-2 rounded-xl bg-surface px-3.5 py-2.5 text-[13px] text-ink-2 shadow-[var(--card-shadow)]">
    <ion-icon :icon="connection.offline ? cloudOfflineOutline : syncOutline" aria-hidden="true" class="mt-0.5 shrink-0 text-base" />
    <span>{{ text }}</span>
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { cloudOfflineOutline, syncOutline } from 'ionicons/icons'
import { connection } from '@/data/offline'
import { formatRelative } from '@/lib/format'
import { useModeStore } from '@/stores/mode'

const mode = useModeStore()
const text = computed(() => {
  if (mode.isDemo) return ''
  const pending = connection.queue.filter((q) => q.state === 'pending').length
  const waiting = pending ? `${pending} ${pending === 1 ? 'entry is' : 'entries are'} waiting to sync.` : ''
  if (connection.offline) return `Offline. Showing data saved ${formatRelative(connection.savedAt)}. ${waiting}`.trim()
  return waiting
})
</script>
