<template>
  <ion-page>
    <ion-content>
      <main class="mx-auto flex min-h-full w-full max-w-md flex-col px-6 pt-[max(env(safe-area-inset-top),24px)] pb-[max(env(safe-area-inset-bottom),24px)]">
        <div class="mt-2 flex items-center justify-between">
          <BrandLogo class="h-8" />
          <!-- Light, dark or the system's setting, before signing in; the choice carries into the app. -->
          <ThemeToggle />
        </div>

        <Transition name="step" mode="out-in">
          <!-- One screen, no scrolling: a short promise, three sources, and the two ways in. -->
          <section v-if="step === 'intro'" key="intro" class="mt-8 flex flex-1 flex-col" aria-labelledby="intro-title">
            <h1 id="intro-title" class="text-[28px] leading-tight font-semibold tracking-tight">Your watch, and what it can't measure.</h1>
            <p class="mt-2 text-[15px] leading-relaxed text-ink-2">Watch data, mood, meals, water and cycle in one place, with every pattern explained.</p>

            <ol class="card mt-6 divide-y divide-line" aria-label="Where your data comes from">
              <li v-for="s in SOURCES" :key="s.title" class="flex items-center gap-3 px-4 py-3">
                <span class="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent" aria-hidden="true">
                  <ion-icon :icon="s.icon" class="text-base" />
                </span>
                <span class="min-w-0">
                  <span class="block text-sm font-semibold">{{ s.title }}</span>
                  <span class="block text-[13px] leading-snug text-ink-2">{{ s.text }}</span>
                </span>
              </li>
            </ol>

            <div class="mt-auto grid gap-3 pt-6">
              <PrimaryButton label="Explore with sample data" @click="step = 'trackers'" />
              <PrimaryButton v-if="mode.backendConfigured" variant="secondary" label="Sign in to your FitApp server" @click="signIn" />
              <p class="text-center text-xs text-muted">Sample data is simulated on this phone and always labelled as such.</p>
            </div>
          </section>

          <section v-else key="trackers" class="mt-10 flex flex-1 flex-col" aria-labelledby="trackers-title">
            <h1 id="trackers-title" class="text-[26px] leading-tight font-semibold tracking-tight">What would you like to track?</h1>
            <p class="mt-2 text-[15px] leading-relaxed text-ink-2">Watch measurements are always included. The personal trackers are optional; change them any time in your profile.</p>

            <ul class="card mt-6 divide-y divide-line">
              <li v-for="t in TRACKERS" :key="t.key">
                <ion-toggle v-model="prefs[t.key]" class="tracker" justify="space-between">
                  <span class="flex items-center gap-3 py-3.5">
                    <span class="grid size-9 shrink-0 place-items-center rounded-lg" :class="`tone tone-${t.tone}`" aria-hidden="true">
                      <ion-icon :icon="t.icon" class="text-lg" style="color: var(--tone-ink)" />
                    </span>
                    <span class="min-w-0 whitespace-normal">
                      <span class="block text-sm font-semibold text-ink">{{ t.label }}</span>
                      <span class="block text-[13px] leading-snug text-ink-2">{{ t.hint }}</span>
                    </span>
                  </span>
                </ion-toggle>
              </li>
            </ul>

            <p v-if="error" role="alert" class="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{{ error }}</p>
            <div class="mt-auto grid gap-3 pt-8">
              <PrimaryButton :label="saving ? 'Setting up…' : 'Start exploring'" :disabled="saving" @click="finish" />
              <button type="button" class="min-h-11 text-sm font-medium text-ink-2" @click="step = 'intro'">Back</button>
            </div>
          </section>
        </Transition>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonContent, IonIcon, IonPage, IonToggle } from '@ionic/vue'
import { layersOutline, phonePortraitOutline, watchOutline } from 'ionicons/icons'
import BrandLogo from '@/components/BrandLogo.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { ICONS } from '@/components/metricIcons'
import type { Tone } from '@/components/PanelSection.vue'
import { onboarding } from '@/lib/onboarding'
import { useJournalStore } from '@/stores/journal'
import { useModeStore } from '@/stores/mode'
import { resetDataStores } from '@/stores/reset'
import type { TrackerPrefs } from '@/types/journal'

const SOURCES = [
  { icon: watchOutline, title: 'Your FitApp watch', text: 'Activity, sleep and heart rate' },
  { icon: phonePortraitOutline, title: 'Health Connect or Apple Health', text: 'For other watches, if you allow it' },
  { icon: layersOutline, title: 'What you add', text: 'Mood, meals, water and cycle' },
]

const TRACKERS: { key: keyof TrackerPrefs; label: string; hint: string; icon: string; tone: Tone }[] = [
  { key: 'mood', label: 'Mood', hint: 'Check-ins with energy and stress you report', icon: ICONS.mood, tone: 'mood' },
  { key: 'food', label: 'Food & water', hint: 'Meals, nutrients and drinks', icon: ICONS.meals, tone: 'energy' },
  { key: 'cycle', label: 'Cycle', hint: 'Periods and symptoms, kept private', icon: ICONS.cycle, tone: 'spo2' },
]

const router = useRouter()
const mode = useModeStore()
const journal = useJournalStore()
const step = ref<'intro' | 'trackers'>('intro')
const prefs = reactive<TrackerPrefs>({ mood: true, food: true, cycle: false })
const saving = ref(false)
const error = ref<string | null>(null)

function signIn() {
  mode.setMode('backend')
  resetDataStores()
  router.push('/login')
}

async function finish() {
  saving.value = true
  error.value = null
  try {
    mode.setMode('demo')
    resetDataStores()
    await journal.savePrefs({ ...prefs })
    onboarding.complete()
    await router.replace('/home')
  } catch {
    error.value = 'Could not save your choices. Try again.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.tracker {
  --track-background-checked: var(--accent);
  /* Ionic forces content-box on toggles, so fill the row as a block instead of width: 100%. */
  display: block;
  padding: 0 16px;
}
.step-enter-active,
.step-leave-active {
  transition:
    opacity 200ms ease-out,
    translate 200ms cubic-bezier(0.23, 1, 0.32, 1);
}
.step-enter-from {
  opacity: 0;
  translate: 16px 0;
}
.step-leave-to {
  opacity: 0;
  translate: -16px 0;
}
</style>
