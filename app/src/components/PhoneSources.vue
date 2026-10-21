<template>
  <!-- Sources on this phone that upload to the signed-in account. Each says plainly what it can and cannot read. -->
  <section aria-labelledby="phone-sources-title">
    <h2 id="phone-sources-title" class="mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">On this phone</h2>
    <ul class="card divide-y divide-line">
      <li v-for="r in rows" :key="r.source.id" class="p-4">
        <div class="flex items-start gap-3">
          <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent" aria-hidden="true">
            <ion-icon :icon="r.source.id === 'fitapp-watch' ? watchOutline : heartCircleOutline" class="text-lg" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-[15px] font-semibold">{{ r.source.name }}</span>
            <span class="block text-[13px] leading-snug" :class="r.state?.error ? 'text-danger' : 'text-ink-2'">{{ r.status }}</span>
          </span>
        </div>

        <p v-if="r.source.provides.length" class="mt-3 text-[13px] leading-snug text-ink-2">
          Can read: {{ r.source.provides.map((m) => MEASUREMENT_LABELS[m]).join(', ') }}.
          <span class="text-muted">Not from this source: {{ missing(r.source.provides) }}.</span>
        </p>

        <!-- The FitApp Watch can always be paired from here: on a phone for real, otherwise as a preview. -->
        <div v-if="r.source.id === 'fitapp-watch' && !r.state && (!r.available || mode.isDemo)" class="mt-3">
          <PrimaryButton label="Pair" @click="pairing = true" />
        </div>
        <div v-if="r.available && !mode.isDemo" class="mt-3 flex flex-wrap gap-2">
          <template v-if="r.state">
            <PrimaryButton :label="sources.syncing ? 'Syncing…' : 'Sync now'" :disabled="sources.syncing" @click="run(r.source.id, () => syncAll())" />
            <PrimaryButton variant="secondary" label="Disconnect" @click="run(r.source.id, () => disconnectSource(r.source.id))" />
          </template>
          <PrimaryButton v-else-if="r.source.id === 'fitapp-watch'" label="Pair" @click="pairing = true" />
          <PrimaryButton v-else :label="busy === r.source.id ? 'Connecting…' : 'Connect'" :disabled="!!busy" @click="run(r.source.id, () => connectSource(r.source.id))" />
          <PrimaryButton v-if="r.source.openSettings" variant="secondary" label="Permissions" @click="r.source.openSettings!()" />
        </div>
        <p v-if="busy === 'fitapp-watch' && r.source.id === 'fitapp-watch' && !r.state" role="status" class="mt-2 text-[13px] text-ink-2">
          Keep the watch close and awake. When it asks, confirm the pairing on the watch.
        </p>
        <p v-if="errors[r.source.id]" role="alert" class="mt-2 text-[13px] text-danger">{{ errors[r.source.id] }}</p>
      </li>
    </ul>
    <p class="mt-2 px-1 text-xs leading-relaxed text-muted">
      {{
        mode.isDemo
          ? 'Sample data has its own watch. Sign in to connect yours.'
          : 'Each measurement comes from one source only, the watch first, so nothing is counted twice. Disconnecting stops new uploads; data already uploaded stays.'
      }}
    </p>
    <PairWatchSheet :open="pairing" @close="pairing = false" @paired="fitness.load()" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { IonIcon } from '@ionic/vue'
import { heartCircleOutline, watchOutline } from 'ionicons/icons'
import PairWatchSheet from '@/components/PairWatchSheet.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import { MEASUREMENT_LABELS } from '@/data/connection'
import { formatRelative } from '@/lib/format'
import { SOURCES } from '@/sources/registry'
import { connectSource, disconnectSource, sources, syncAll, useAccount } from '@/sources/sync'
import type { Availability, SourceId } from '@/sources/types'
import { useAuthStore } from '@/stores/auth'
import { useFitnessStore } from '@/stores/fitness'
import { useModeStore } from '@/stores/mode'
import { MEASUREMENTS, type Measurement } from '@/types/fitness'

const mode = useModeStore()
const auth = useAuthStore()
const fitness = useFitnessStore()
const availability = reactive<Partial<Record<SourceId, Availability>>>({})
const errors = reactive<Partial<Record<SourceId, string>>>({})
const busy = ref<SourceId | null>(null)
const pairing = ref(false)

watch(() => (mode.isDemo ? null : auth.user?.id ?? null), useAccount, { immediate: true })
onMounted(async () => {
  for (const s of SOURCES) availability[s.id] = await s.availability()
})

const missing = (provides: Measurement[]) =>
  MEASUREMENTS.filter((m) => !provides.includes(m))
    .map((m) => MEASUREMENT_LABELS[m].toLowerCase())
    .join(', ')

const rows = computed(() =>
  SOURCES.map((source) => {
    const a = availability[source.id]
    const state = sources.state[source.id]
    const status = !a
      ? 'Checking…'
      : !a.available
        ? a.reason ?? 'Not available'
        : state?.error
          ? state.error
          : state
            ? `Connected · ${state.lastSyncAt ? `synced ${formatRelative(state.lastSyncAt)}` : 'not synced yet'}`
            : 'Not connected'
    return { source, state, available: !!a?.available, status }
  }),
)

async function run(id: SourceId, action: () => Promise<void>) {
  busy.value = id
  delete errors[id]
  try {
    await action()
    await fitness.load()
  } catch (err) {
    errors[id] = err instanceof Error ? err.message : 'Something went wrong.'
  } finally {
    busy.value = null
  }
}
</script>
