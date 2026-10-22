<template>
  <!-- A small round button like the mobile toolbar's: the watch and its sync dot; the details are in its label. -->
  <RouterLink
    to="/device"
    class="relative grid size-10 shrink-0 place-items-center rounded-full bg-surface text-ink-2 shadow-[var(--card-shadow)] transition-colors duration-150 hover:text-accent"
    :aria-label="`Watch and sync: ${label}`"
    :title="label"
  >
    <ion-icon :icon="watchOutline" aria-hidden="true" class="text-xl" />
    <span class="absolute top-1 right-1 size-2.5 rounded-full ring-2 ring-[var(--surface)]" :class="dotClass" aria-hidden="true" />
  </RouterLink>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { IonIcon } from '@ionic/vue'
import { watchOutline } from 'ionicons/icons'
import { SYNC_LABELS, syncState } from '@/data/connection'
import { formatRelative } from '@/lib/format'
import { useFitnessStore } from '@/stores/fitness'

const fitness = useFitnessStore()
// It sits on every page, including ones that load no watch data themselves (Settings).
onMounted(() => fitness.ensureLoaded())
const status = computed(() => fitness.status)
const state = computed(() => syncState(status.value))
const label = computed(() => {
  const source = status.value?.sources[0]
  const sync = `${SYNC_LABELS[state.value]}${status.value?.lastIngestedAt ? `, ${formatRelative(status.value.lastIngestedAt)}` : ''}`
  return `${source?.device ?? source?.name ?? 'No watch data source'}. ${sync}`
})
const dotClass = computed(
  () => ({ current: 'bg-[#0ca30c]', delayed: 'bg-[#fab219]', stale: 'bg-danger', none: 'bg-line-strong' })[state.value],
)
</script>
