<template>
  <!-- The steps that get this watch's data into FitApp on this phone, each with its own action. -->
  <ol class="card divide-y divide-line" aria-label="How to connect">
    <li v-if="unsupported" class="flex gap-3 p-4">
      <span class="grid size-8 shrink-0 place-items-center rounded-full bg-danger-soft text-danger" aria-hidden="true"><ion-icon :icon="alertCircleOutline" /></span>
      <p class="text-[14px] leading-snug text-ink-2">{{ unsupported }}</p>
    </li>
    <li v-for="(s, i) in steps" :key="s.key" class="flex items-center gap-3 p-4">
      <span
        class="grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-semibold transition-colors duration-200"
        :class="s.done ? 'bg-accent text-accent-ink' : 'bg-accent-soft text-accent'"
        aria-hidden="true"
      >
        <ion-icon v-if="s.done" :icon="checkmark" class="text-base" />
        <template v-else>{{ i + 1 }}</template>
      </span>
      <span class="min-w-0 flex-1">
        <span class="block text-[15px] font-semibold">{{ s.title }}</span>
        <span class="block text-[13px] leading-snug" :class="errors[s.key] ? 'text-danger' : 'text-ink-2'">{{ errors[s.key] ?? s.text }}</span>
      </span>
      <button
        v-if="s.source && !s.done"
        type="button"
        v-ripple
        class="min-h-9 shrink-0 rounded-full bg-accent px-4 text-sm font-medium text-accent-ink transition-[opacity,scale] duration-150 active:enabled:scale-[0.96] disabled:opacity-40"
        :disabled="!!busy || (s.source !== 'fitapp-watch' && !ready(s.source))"
        @click="s.source === 'fitapp-watch' ? (pairing = true) : connect(s.source)"
      >
        {{ busy === s.source ? 'Waiting…' : s.action }}
      </button>
    </li>
  </ol>
  <PairWatchSheet :open="pairing" @close="pairing = false" @paired="paired = true" />
  <p v-if="note" class="mt-2 px-1 text-xs leading-relaxed text-muted">{{ note }}</p>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { IonIcon } from '@ionic/vue'
import { Capacitor } from '@capacitor/core'
import { alertCircleOutline, checkmark } from 'ionicons/icons'
import PairWatchSheet from '@/components/PairWatchSheet.vue'
import { wearableInfo, type Platform } from '@/data/wearables'
import { SOURCES } from '@/sources/registry'
import { connectSource, sources, useAccount } from '@/sources/sync'
import type { Availability, SourceId } from '@/sources/types'
import { useAuthStore } from '@/stores/auth'
import { useModeStore } from '@/stores/mode'
import type { Wearable } from '@/types/auth'

const props = defineProps<{ wearable: Wearable | null }>()
const auth = useAuthStore()
const mode = useModeStore()

const native = Capacitor.isNativePlatform()
// In a browser the steps are shown for Android, the main target; the buttons stay off with a note.
const platform: Platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android'
const store = platform === 'ios' ? 'Apple Health' : 'Health Connect'
const storeSource: SourceId = platform === 'ios' ? 'apple-health' : 'health-connect'

const info = computed(() => wearableInfo(props.wearable?.brand))
const routes = computed(() => info.value.routes[platform])
const unsupported = computed(() => routes.value.find((r) => !['direct', 'share', 'built-in'].includes(r)) ?? null)

const availability = reactive<Partial<Record<SourceId, Availability>>>({})
const errors = reactive<Record<string, string>>({})
const busy = ref<SourceId | null>(null)
const pairing = ref(false)
/** A preview pairing (browser or sample data) has no real connection to show, so remember it here. */
const paired = ref(false)

watch(() => (mode.isDemo ? null : auth.user?.id ?? null), useAccount, { immediate: true })
onMounted(async () => {
  for (const s of SOURCES) availability[s.id] = await s.availability()
})

const connected = (id: SourceId) => !!sources.state[id]
const ready = (id: SourceId) => !mode.isDemo && !!availability[id]?.available

interface Step {
  key: string
  title: string
  text: string
  source?: SourceId
  action?: string
  done: boolean
}

const steps = computed<Step[]>(() => {
  const w = info.value
  const out: Step[] = []
  const allow = (text: string): Step => ({ key: 'allow', title: `Allow access to ${store}`, text, source: storeSource, action: 'Allow', done: connected(storeSource) })
  if (routes.value.includes('direct')) {
    out.push({ key: 'pair', title: `Pair your ${w.short}`, text: 'Keep the watch close and awake, then confirm on the watch.', source: 'fitapp-watch', action: 'Pair', done: connected('fitapp-watch') || paired.value })
  }
  if (routes.value.includes('share')) {
    const app = w.app ?? (props.wearable?.model ? `the ${props.wearable.model} app` : "your watch's app")
    out.push({ key: 'share', title: `Turn on sharing in ${w.app ?? 'its app'}`, text: `In ${app}, open its settings and allow sharing with ${store}.`, done: false })
    out.push(allow(`FitApp reads steps, activity, workouts and heart rate from ${store}.`))
  }
  if (routes.value.includes('built-in')) {
    out.push(allow(w.brand === 'none' ? `Your phone counts steps on its own; FitApp reads them from ${store}.` : `Your Apple Watch already saves to Apple Health. FitApp reads steps, activity, workouts and heart rate.`))
  }
  return out
})

const note = computed(() => {
  if (mode.isDemo) return info.value.brand === 'fitapp' ? null : 'Sample data comes with its own watch, so nothing to connect here.'
  if (!native) return info.value.brand === 'fitapp' ? null : 'Connecting works in the FitApp app for Android and iPhone.'
  const missing = steps.value.find((s) => s.source && !availability[s.source]?.available && availability[s.source])
  return missing ? availability[missing.source!]!.reason ?? null : null
})

async function connect(id: SourceId) {
  busy.value = id
  delete errors[id === 'fitapp-watch' ? 'pair' : 'allow']
  try {
    // Connecting also runs the first sync.
    await connectSource(id)
  } catch (err) {
    errors[id === 'fitapp-watch' ? 'pair' : 'allow'] = err instanceof Error ? err.message : 'Could not connect.'
  } finally {
    busy.value = null
  }
}

defineExpose({ anyConnected: computed(() => SOURCES.some((s) => connected(s.id))) })
</script>
