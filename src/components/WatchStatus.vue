<template>
  <!-- Toolbar shortcut to the Device tab; the dot carries the sync state, the label says it in full. -->
  <RouterLink
    to="/device"
    class="relative grid size-9 place-items-center rounded-full bg-surface text-ink-2 shadow-[var(--card-shadow)]"
    :aria-label="label"
    :title="label"
  >
    <ion-icon :icon="watchOutline" aria-hidden="true" class="text-lg" />
    <span class="absolute top-0.5 right-0.5 size-2.5 rounded-full ring-2 ring-[var(--page)]" :class="dotClass" aria-hidden="true" />
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { watchOutline } from 'ionicons/icons'
import { SYNC_LABELS, syncState } from '@/data/connection'
import { formatRelative } from '@/lib/format'
import { useFitnessStore } from '@/stores/fitness'

const fitness = useFitnessStore()
const state = computed(() => syncState(fitness.status))
const label = computed(() => {
  const s = fitness.status
  const device = s?.sources[0]?.device ?? s?.sources[0]?.name ?? 'No watch data source'
  return `${device}: ${SYNC_LABELS[state.value]}${s?.lastIngestedAt ? `, ${formatRelative(s.lastIngestedAt)}` : ''}`
})
const dotClass = computed(
  () => ({ current: 'bg-[#0ca30c]', delayed: 'bg-[#fab219]', stale: 'bg-danger', none: 'bg-line-strong' })[state.value],
)
</script>
