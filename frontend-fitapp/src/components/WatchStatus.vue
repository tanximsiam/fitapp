<template>
  <RouterLink
    to="/device"
    class="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-rail px-4 py-3 text-sm transition-colors duration-150 hover:bg-line/70"
    aria-label="Watch and connection details"
  >
    <span class="flex items-center gap-2 font-medium">
      <ion-icon :icon="watchOutline" aria-hidden="true" class="text-lg text-ink-2" />
      {{ source?.device ?? source?.name ?? 'No watch data source' }}
      <span v-if="mode.isDemo" class="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-ink">Simulated</span>
    </span>
    <span class="flex items-center gap-1.5 text-ink-2">
      <span class="size-2 rounded-full" :class="dotClass" aria-hidden="true" />
      {{ SYNC_LABELS[state] }}<template v-if="status?.lastIngestedAt"> · last sync {{ formatRelative(status.lastIngestedAt) }}</template>
    </span>
    <span v-if="status?.latestHeartRate" class="text-ink-2">
      Latest heart-rate reading <span class="tabular font-medium text-ink">{{ status.latestHeartRate.bpm }} bpm</span>
      at {{ formatClock(status.latestHeartRate.at) }}<template v-if="status.latestHeartRate.at.slice(0, 10) !== fitness.today">, {{ formatShortDate(status.latestHeartRate.at.slice(0, 10)) }}</template>
    </span>
    <ion-icon :icon="chevronForwardOutline" aria-hidden="true" class="ml-auto text-muted" />
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { chevronForwardOutline, watchOutline } from 'ionicons/icons'
import { SYNC_LABELS, syncState } from '@/data/connection'
import { formatClock, formatRelative, formatShortDate } from '@/lib/format'
import { useFitnessStore } from '@/stores/fitness'
import { useModeStore } from '@/stores/mode'

const fitness = useFitnessStore()
const mode = useModeStore()
const status = computed(() => fitness.status)
const source = computed(() => status.value?.sources[0] ?? null)
const state = computed(() => syncState(status.value))
const dotClass = computed(
  () => ({ current: 'bg-[#0ca30c]', delayed: 'bg-[#fab219]', stale: 'bg-danger', none: 'bg-line-strong' })[state.value],
)
</script>
