<template>
  <!-- Pairing a FitApp Watch directly: search, pick the watch, confirm on the watch, done. -->
  <ion-modal :is-open="open" :initial-breakpoint="1" :breakpoints="[0, 1]" class="sheet" aria-labelledby="pair-title" @will-dismiss="close" @will-present="reset">
    <div class="flex min-h-[26rem] flex-col items-center px-6 pt-5 pb-[max(env(safe-area-inset-bottom),24px)] text-center">
      <div class="flex w-full justify-end">
        <button type="button" class="grid size-9 place-items-center rounded-full text-ink-2 hover:bg-page" aria-label="Close" @click="close">
          <ion-icon :icon="closeOutline" aria-hidden="true" class="text-xl" />
        </button>
      </div>

      <div class="relative mt-2 grid size-36 place-items-center" aria-hidden="true">
        <span v-if="state === 'searching' || state === 'confirm'" class="pulse absolute inset-0 rounded-full" />
        <span v-if="state === 'searching'" class="pulse late absolute inset-0 rounded-full" />
        <WatchDial kind="fitapp" class="relative size-24" />
        <span v-if="state === 'done'" class="absolute right-3 bottom-3 grid size-9 place-items-center rounded-full bg-accent text-accent-ink ring-4 ring-[var(--surface)]">
          <ion-icon :icon="checkmark" class="text-lg" />
        </span>
      </div>

      <div class="mt-5 w-full" aria-live="polite">
        <template v-if="state === 'intro'">
          <h2 id="pair-title" :class="TITLE">Pair your FitApp Watch</h2>
          <p :class="TEXT">Turn on the watch, keep it close to your phone and make sure Bluetooth is on.</p>
        </template>
        <template v-else-if="state === 'searching'">
          <h2 id="pair-title" :class="TITLE">Looking for watches…</h2>
          <p :class="TEXT">This takes a few seconds.</p>
        </template>
        <template v-else-if="state === 'found'">
          <h2 id="pair-title" :class="TITLE">Choose your watch</h2>
          <ul class="mt-4 grid gap-2">
            <li v-for="w in found" :key="w.id">
              <button type="button" class="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-page px-4 text-left transition-colors duration-150 hover:bg-accent-soft" @click="choose(w)">
                <ion-icon :icon="watchOutline" aria-hidden="true" class="text-xl text-accent" />
                <span class="min-w-0 flex-1">
                  <span class="block text-[15px] font-semibold">{{ w.name }}</span>
                  <span class="block text-[12px] text-muted">{{ w.signal }}</span>
                </span>
                <ion-icon :icon="chevronForward" aria-hidden="true" class="text-muted" />
              </button>
            </li>
          </ul>
        </template>
        <template v-else-if="state === 'confirm'">
          <h2 id="pair-title" :class="TITLE">Confirm on your watch</h2>
          <p :class="TEXT">Tap the check mark on {{ chosen ?? 'your watch' }} to finish pairing.</p>
        </template>
        <template v-else-if="state === 'done'">
          <h2 id="pair-title" :class="TITLE">Paired</h2>
          <p :class="TEXT">{{ chosen ?? 'Your watch' }} is connected. Activity, sleep and heart rate will sync from now on.</p>
        </template>
        <template v-else>
          <h2 id="pair-title" :class="TITLE">Couldn't pair</h2>
          <p role="alert" :class="TEXT">{{ error }}</p>
        </template>
      </div>

      <div class="mt-auto grid w-full gap-2 pt-8">
        <PrimaryButton v-if="state === 'intro' || state === 'error'" :label="state === 'error' ? 'Try again' : 'Search for watch'" @click="search" />
        <PrimaryButton v-else-if="state === 'done'" label="Done" @click="finish" />
        <p v-if="preview && state !== 'done'" class="text-[12px] text-muted">{{ mode.isDemo ? 'Sample data: this shows how pairing works.' : 'Preview: pairing runs in the FitApp app on your phone.' }}</p>
      </div>
    </div>
  </ion-modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { IonIcon, IonModal } from '@ionic/vue'
import { Capacitor } from '@capacitor/core'
import { checkmark, chevronForward, closeOutline, watchOutline } from 'ionicons/icons'
import PrimaryButton from '@/components/PrimaryButton.vue'
import WatchDial from '@/components/WatchDial.vue'
import { connectSource } from '@/sources/sync'
import { useModeStore } from '@/stores/mode'

const TITLE = 'text-[22px] leading-tight font-semibold tracking-tight'
const TEXT = 'mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-ink-2'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; paired: [] }>()
const mode = useModeStore()

type State = 'intro' | 'searching' | 'found' | 'confirm' | 'done' | 'error'
const state = ref<State>('intro')
const error = ref('')
const chosen = ref<string | null>(null)
const found = ref<{ id: string; name: string; signal: string }[]>([])
/** Without Bluetooth (a browser) or with sample data, the same steps play as a preview. */
const preview = computed(() => mode.isDemo || !Capacitor.isNativePlatform())
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function reset() {
  state.value = 'intro'
  chosen.value = null
  error.value = ''
}

async function search() {
  state.value = 'searching'
  if (preview.value) {
    await wait(1800)
    found.value = [{ id: 'fw-7f2a', name: 'FitApp Watch 7F2A', signal: 'Strong signal · nearby' }]
    state.value = 'found'
    return
  }
  // On a phone the system shows the nearby watches; then the watch asks to confirm.
  state.value = 'confirm'
  try {
    await connectSource('fitapp-watch')
    state.value = 'done'
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'The watch did not answer. Keep it close and try again.'
    state.value = 'error'
  }
}

async function choose(w: { name: string }) {
  chosen.value = w.name
  state.value = 'confirm'
  await wait(2200)
  state.value = 'done'
}

function finish() {
  emit('paired')
  emit('close')
}
const close = () => emit('close')
</script>

<style scoped>
.pulse {
  background: var(--accent-soft);
  animation: pulse 1.8s cubic-bezier(0.23, 1, 0.32, 1) infinite;
}
.pulse.late {
  animation-delay: 0.9s;
}
@keyframes pulse {
  from {
    scale: 0.6;
    opacity: 0.9;
  }
  to {
    scale: 1.15;
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .pulse {
    animation: none;
    opacity: 0.5;
  }
}
</style>
