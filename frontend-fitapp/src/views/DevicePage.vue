<template>
  <AppShell title="Watch & connection">
    <template #subtitle>{{ mode.isDemo ? 'Simulated watch for the demo' : 'Devices and bridges that send data to your FitApp backend' }}</template>

    <DataState>
      <div class="grid gap-4">
        <PanelSection v-for="s in sources" :key="s.key" :title="s.device ?? s.name">
          <template #aside>
            <span class="flex items-center gap-1.5 text-sm text-ink-2">
              <span class="size-2 rounded-full" :class="dotClass" aria-hidden="true" />{{ SYNC_LABELS[state] }}
            </span>
          </template>
          <dl class="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            <MetricItem label="Provider" :value="mode.isDemo ? 'Simulation' : s.name" :note="mode.isDemo ? undefined : s.key" />
            <MetricItem label="Last successful sync" :value="formatRelative(s.lastIngestedAt)" />
            <MetricItem label="Latest data for" :value="s.latestDate ? formatShortDate(s.latestDate) : EMPTY" />
            <MetricItem
              label="Latest heart-rate reading"
              :value="fitness.status?.latestHeartRate ? `${fitness.status.latestHeartRate.bpm} bpm` : EMPTY"
              :note="fitness.status?.latestHeartRate ? `at ${formatClock(fitness.status.latestHeartRate.at)}, ${formatShortDate(fitness.status.latestHeartRate.at.slice(0, 10))}` : undefined"
            />
          </dl>
          <p v-if="s.lastIngestedAt" class="mt-4 text-xs text-muted">Synced {{ formatAbsolute(s.lastIngestedAt) }}. Values are the latest uploaded, not live.</p>

          <h3 class="mt-6 text-sm font-semibold">
            Measurements
            <span class="font-normal text-muted">· {{ s.measurements.length }} of {{ MEASUREMENTS.length }} provided</span>
          </h3>
          <ShowMore v-model:expanded="showMeasurements" :controls="`measurements-${s.key}`" more-label="Show which" less-label="Hide list" />
          <ul v-show="showMeasurements" :id="`measurements-${s.key}`" class="mt-2 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            <li v-for="m in MEASUREMENTS" :key="m" class="flex items-center gap-2">
              <ion-icon
                :icon="s.measurements.includes(m) ? checkmarkCircleOutline : removeCircleOutline"
                :class="s.measurements.includes(m) ? 'text-ink' : 'text-muted'"
                aria-hidden="true"
              />
              <span :class="s.measurements.includes(m) ? '' : 'text-muted'">{{ MEASUREMENT_LABELS[m] }}</span>
              <span class="sr-only">{{ s.measurements.includes(m) ? 'provided' : 'not provided' }}</span>
            </li>
          </ul>
          <p v-if="!s.measurements.length" class="mt-2 text-xs text-muted">
            This source has not declared its measurements. FitApp has received: {{ s.received.join(', ').replace(/_/g, ' ') || 'nothing yet' }}.
          </p>
        </PanelSection>

        <PanelSection v-if="mode.isDemo" title="Simulation controls">
          <p class="mb-4 max-w-prose text-sm text-ink-2">
            Try how FitApp shows different connection states. This changes only the simulated watch in this browser.
          </p>
          <div role="radiogroup" aria-label="Simulated connection state" class="grid gap-3 sm:grid-cols-3">
            <label v-for="opt in SCENARIOS" :key="opt.value" :class="optionClass(scenario === opt.value)">
              <input type="radio" name="scenario" class="mt-1 accent-[var(--accent)]" :checked="scenario === opt.value" @change="setScenario(opt.value)" />
              <span>
                <span class="block text-sm font-medium">{{ opt.label }}</span>
                <span class="mt-0.5 block text-xs text-ink-2">{{ opt.hint }}</span>
              </span>
            </label>
          </div>
          <div class="mt-4 flex items-center gap-3">
            <PrimaryButton variant="secondary" label="Simulate sync now" @click="syncNow" />
            <p v-if="synced" role="status" class="text-sm text-ink-2">Simulated sync completed.</p>
          </div>
        </PanelSection>
      </div>
    </DataState>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { IonIcon } from '@ionic/vue'
import { checkmarkCircleOutline, removeCircleOutline } from 'ionicons/icons'
import AppShell from '@/components/AppShell.vue'
import ShowMore from '@/components/ShowMore.vue'
import DataState from '@/components/DataState.vue'
import MetricItem from '@/components/MetricItem.vue'
import PanelSection from '@/components/PanelSection.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import { useFitnessData } from '@/composables/useFitnessData'
import { demoControls, type DemoScenario } from '@/data/adapters'
import { MEASUREMENT_LABELS, SYNC_LABELS, syncState } from '@/data/connection'
import { EMPTY, formatClock, formatRelative, formatShortDate } from '@/lib/format'
import { MEASUREMENTS } from '@/types/fitness'

const { fitness, mode } = useFitnessData()

const sources = computed(() => fitness.status?.sources ?? [])
const state = computed(() => syncState(fitness.status))
const dotClass = computed(() => ({ current: 'bg-[#0ca30c]', delayed: 'bg-[#fab219]', stale: 'bg-danger', none: 'bg-line-strong' })[state.value])
const formatAbsolute = (iso: string) => new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })

const SCENARIOS: { value: DemoScenario; label: string; hint: string }[] = [
  { value: 'synced', label: 'Syncing normally', hint: 'Uploads every 15 minutes.' },
  { value: 'delayed', label: 'Sync delayed', hint: 'Last upload 9 hours ago.' },
  { value: 'offline', label: 'Not syncing', hint: 'Nothing since two days ago.' },
]
const scenario = ref<DemoScenario>(demoControls.scenario())
const synced = ref(false)
const showMeasurements = ref(false)
const optionClass = (selected: boolean) => [
  'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors duration-150',
  selected ? 'border-accent bg-accent-soft/50' : 'border-line hover:border-line-strong',
]

async function reloadAll() {
  fitness.$reset()
  await fitness.load()
}

async function setScenario(next: DemoScenario) {
  demoControls.setScenario(next)
  scenario.value = next
  synced.value = false
  await reloadAll()
}

async function syncNow() {
  demoControls.syncNow()
  scenario.value = 'synced'
  await reloadAll()
  synced.value = true
}
</script>
