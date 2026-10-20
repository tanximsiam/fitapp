<template>
  <RouterLink to="/device" class="card group flex items-center gap-3 py-2.5 pr-3 pl-2.5" aria-label="Watch and connection details">
    <span class="relative grid size-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent" aria-hidden="true">
      <ion-icon :icon="watchOutline" class="text-lg" />
      <span class="absolute -top-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-[var(--surface)]" :class="dotClass" />
    </span>
    <span class="min-w-0">
      <span class="block truncate text-sm font-semibold">
        {{ source?.device ?? source?.name ?? 'No watch data source' }}<span v-if="mode.isDemo && !/simulated/i.test(source?.device ?? '')" class="font-normal text-muted"> · simulated</span>
      </span>
      <span class="block truncate text-xs text-ink-2">
        {{ SYNC_LABELS[state] }}<template v-if="status?.lastIngestedAt">, {{ formatRelative(status.lastIngestedAt) }}</template>
      </span>
    </span>
    <ion-icon :icon="chevronForwardOutline" aria-hidden="true" class="shrink-0 text-muted transition-transform duration-150 group-hover:translate-x-0.5" />
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { chevronForwardOutline, watchOutline } from 'ionicons/icons'
import { SYNC_LABELS, syncState } from '@/data/connection'
import { formatRelative } from '@/lib/format'
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
