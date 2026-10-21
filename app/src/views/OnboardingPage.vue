<template>
  <ion-page>
    <ion-content>
      <main class="mx-auto flex min-h-full w-full max-w-md flex-col px-6 pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),24px)]">
        <div class="flex h-11 items-center">
          <button v-if="step > 0 || mode.isDemo" type="button" class="-ml-2 grid size-11 shrink-0 place-items-center rounded-full text-ink" aria-label="Back" @click="back">
            <ion-icon :icon="arrowBack" aria-hidden="true" class="text-[22px]" />
          </button>
        </div>
        <div class="mt-3 flex gap-1.5" role="progressbar" :aria-valuenow="step + 1" aria-valuemin="1" :aria-valuemax="STEPS" :aria-label="`Step ${step + 1} of ${STEPS}`">
            <span v-for="i in STEPS" :key="i" class="h-1 flex-1 rounded-full transition-colors duration-300" :class="i <= step + 1 ? 'bg-accent' : 'bg-line'" />
        </div>

        <Transition :name="direction" mode="out-in">
          <!-- 1. About you -->
          <section v-if="step === 0" key="about" class="pt-8" aria-labelledby="about-title">
            <h1 id="about-title" :class="H1">About you</h1>
            <p :class="LEAD">A name for your greetings, and your age to put readings in context.</p>
            <div class="mt-8 grid gap-4">
              <FormInput v-model="name" label="Name" required autocomplete="name" />
              <FormInput v-model="birthDate" label="Date of birth" type="date" required autocomplete="bday" :error="birthDateInvalid" :hint="birthDateInvalid ? 'Enter a date in the past.' : undefined" />
            </div>
          </section>

          <!-- 2. Wearable -->
          <section v-else-if="step === 1" key="wearable" class="pt-8" aria-labelledby="wearable-title">
            <h1 id="wearable-title" :class="H1">Which watch or tracker do you use?</h1>
            <p :class="LEAD">This decides how FitApp connects to it.</p>
            <div class="mt-6 grid grid-cols-2 gap-3" role="radiogroup" aria-labelledby="wearable-title">
              <!-- FitApp's own watch first, across the row: it pairs with the app directly. -->
              <button
                type="button"
                role="radio"
                :aria-checked="brand === 'fitapp'"
                class="choice col-span-2 flex items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition-[background-color,box-shadow,scale] duration-200 ease-out active:scale-[0.98]"
                :class="brand === 'fitapp' ? 'is-selected' : 'bg-surface shadow-[var(--card-shadow)]'"
                @click="brand = 'fitapp'"
              >
                <WatchDial kind="fitapp" class="dial size-16 shrink-0" />
                <span class="min-w-0">
                  <span class="block text-[15px] font-semibold">FitApp Watch</span>
                  <span class="block text-[13px] text-ink-2">Pair your watch</span>
                </span>
              </button>
              <button
                v-for="w in WEARABLES.filter((x) => x.brand !== 'fitapp')"
                :key="w.brand"
                type="button"
                role="radio"
                :aria-checked="brand === w.brand"
                class="choice flex flex-col items-center gap-2 rounded-2xl px-2 pt-4 pb-3 text-center transition-[background-color,box-shadow,scale] duration-200 ease-out active:scale-[0.97]"
                :class="brand === w.brand ? 'is-selected' : 'bg-surface shadow-[var(--card-shadow)]'"
                @click="brand = w.brand"
              >
                <WatchDial :kind="w.brand as Exclude<WearableBrand, 'none'>" class="dial size-16" />
                <span class="text-[13px] leading-tight font-medium" :class="brand === w.brand ? 'text-ink' : 'text-ink-2'">{{ w.name }}</span>
              </button>
            </div>
            <button
              type="button"
              role="radio"
              :aria-checked="brand === 'none'"
              class="mt-3 min-h-11 w-full rounded-full text-sm font-medium transition-colors duration-150"
              :class="brand === 'none' ? 'bg-accent-soft text-accent' : 'text-ink-2'"
              @click="brand = 'none'"
            >
              I don't use one
            </button>
            <!-- The model only matters when FitApp has to explain an unfamiliar app. -->
            <div v-if="brand === 'other'" class="mt-3">
              <FormInput v-model="model" label="Which one?" placeholder="For example Oura Ring, Whoop, Polar" hint="So the next step can name its app." />
            </div>
          </section>

          <!-- 3. Trackers and goals -->
          <section v-else-if="step === 2" key="track" class="pt-8" aria-labelledby="track-title">
            <h1 id="track-title" :class="H1">What would you like to track?</h1>
            <p :class="LEAD">Your watch covers activity, sleep and heart rate. Add what it can't measure.</p>
            <div class="mt-6 grid grid-cols-2 gap-3">
              <button
                v-for="t in TRACKERS"
                :key="t.key"
                type="button"
                role="checkbox"
                :aria-checked="prefs[t.key]"
                class="choice relative flex min-h-[92px] flex-col justify-between rounded-2xl p-3.5 text-left transition-[background-color,box-shadow,scale] duration-200 ease-out active:scale-[0.97]"
                :class="[prefs[t.key] ? 'is-selected' : 'bg-surface shadow-[var(--card-shadow)]', `tone-${t.tone}`]"
                @click="prefs[t.key] = !prefs[t.key]"
              >
                <span class="badge grid size-8 place-items-center rounded-lg" aria-hidden="true"><ion-icon :icon="t.icon" class="text-base" /></span>
                <span class="text-[14px] leading-tight font-semibold">{{ t.label }}</span>
                <span class="check absolute top-3 right-3 grid size-5 place-items-center rounded-full" aria-hidden="true">
                  <ion-icon v-if="prefs[t.key]" :icon="checkmark" class="text-[13px]" />
                </span>
              </button>
            </div>

            <h2 class="mt-8 mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">Daily goals</h2>
            <ul class="card divide-y divide-line">
              <li v-for="g in visibleGoals" :key="g.key" class="flex items-center gap-3 py-2.5 pr-2.5 pl-4">
                <span class="min-w-0 flex-1 text-[15px] font-medium">{{ g.label }}</span>
                <button type="button" :class="STEP_BTN" :aria-label="`Lower ${g.label.toLowerCase()} goal`" :disabled="goals[g.key] <= g.min" @click="nudge(g, -1)">
                  <ion-icon :icon="remove" aria-hidden="true" />
                </button>
                <output class="tabular w-[84px] text-center text-[15px] font-semibold" aria-live="polite">{{ g.format(goals[g.key]) }}</output>
                <button type="button" :class="STEP_BTN" :aria-label="`Raise ${g.label.toLowerCase()} goal`" :disabled="goals[g.key] >= g.max" @click="nudge(g, 1)">
                  <ion-icon :icon="add" aria-hidden="true" />
                </button>
              </li>
            </ul>
          </section>

          <!-- 4. Connect, privacy, first sync -->
          <section v-else key="connect" class="pt-8" aria-labelledby="connect-title">
            <h1 id="connect-title" :class="H1">{{ brand === 'none' ? 'Connect your phone' : `Connect your ${wearableInfo(brand).short}` }}</h1>
            <p :class="LEAD">Data arrives automatically once this is done. Your first sync starts right away.</p>
            <div class="mt-6"><ConnectionPlan ref="plan" :wearable="wearable" /></div>

            <ul class="mt-6 grid gap-3 px-1" aria-label="Privacy">
              <li v-for="p in PRIVACY" :key="p.text" class="flex gap-3 text-[13px] leading-snug text-ink-2">
                <ion-icon :icon="p.icon" aria-hidden="true" class="mt-px shrink-0 text-base text-accent" />{{ p.text }}
              </li>
            </ul>
          </section>
        </Transition>

        <div class="mt-auto grid gap-2 pt-8">
          <p v-if="error" role="alert" class="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{{ error }}</p>
          <PrimaryButton :label="step < STEPS - 1 ? 'Continue' : saving ? 'Finishing…' : 'Finish'" :disabled="!canContinue || saving" @click="next" />
          <button v-if="step === STEPS - 1" type="button" class="min-h-11 text-sm font-medium text-ink-2" :disabled="saving" @click="finish">Connect later</button>
        </div>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { IonContent, IonIcon, IonPage, useBackButton } from '@ionic/vue'
import { add, arrowBack, checkmark, eyeOffOutline, lockClosedOutline, optionsOutline, remove } from 'ionicons/icons'
import * as authApi from '@/api/auth'
import { errorMessage, tokenStorage } from '@/api/client'
import ConnectionPlan from '@/components/ConnectionPlan.vue'
import FormInput from '@/components/FormInput.vue'
import { ICONS } from '@/components/metricIcons'
import type { Tone } from '@/components/PanelSection.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import WatchDial from '@/components/WatchDial.vue'
import { WEARABLES, wearableInfo } from '@/data/wearables'
import { formatDuration, formatInt } from '@/lib/format'
import { onboarding } from '@/lib/onboarding'
import { sampleProfile } from '@/lib/sampleProfile'
import { todayIn } from '@/lib/dates'
import { useAuthStore } from '@/stores/auth'
import { useFitnessStore } from '@/stores/fitness'
import { useJournalStore } from '@/stores/journal'
import { useModeStore } from '@/stores/mode'
import type { Goals } from '@/types/fitness'
import type { TrackerPrefs } from '@/types/journal'
import type { Wearable, WearableBrand } from '@/types/auth'

const STEPS = 4
const H1 = 'text-[26px] leading-tight font-semibold tracking-tight'
const LEAD = 'mt-2 text-[15px] leading-relaxed text-ink-2'
const STEP_BTN =
  'grid size-9 shrink-0 place-items-center rounded-full bg-page text-lg text-ink transition-[background-color,scale] duration-150 active:enabled:scale-[0.92] disabled:opacity-35'

const TRACKERS: { key: keyof TrackerPrefs; label: string; icon: string; tone: Tone }[] = [
  { key: 'mood', label: 'Mood & emotions', icon: ICONS.mood, tone: 'mood' },
  { key: 'food', label: 'Food & nutrition', icon: ICONS.meals, tone: 'energy' },
  { key: 'hydration', label: 'Hydration', icon: ICONS.water, tone: 'activity' },
  { key: 'cycle', label: 'Menstrual health', icon: ICONS.cycle, tone: 'spo2' },
]

type GoalKey = 'steps' | 'activeKcal' | 'sleepMin' | 'waterMl'
interface GoalRow {
  key: GoalKey
  label: string
  step: number
  min: number
  max: number
  format: (n: number) => string
}
const GOALS: GoalRow[] = [
  { key: 'steps', label: 'Steps', step: 500, min: 1000, max: 30000, format: formatInt },
  { key: 'activeKcal', label: 'Activity', step: 50, min: 100, max: 2000, format: (n) => `${formatInt(n)} kcal` },
  { key: 'sleepMin', label: 'Sleep', step: 15, min: 300, max: 660, format: (n) => formatDuration(n) },
  { key: 'waterMl', label: 'Water', step: 250, min: 500, max: 5000, format: (n) => `${n / 1000} L` },
]

const PRIVACY = [
  { icon: lockClosedOutline, text: 'Your records go only to your FitApp account.' },
  { icon: optionsOutline, text: "Change what FitApp may read at any time in your phone's settings." },
  { icon: eyeOffOutline, text: 'Disconnect a watch or app whenever you like, from your profile.' },
]

const router = useRouter()
const auth = useAuthStore()
const mode = useModeStore()
const fitness = useFitnessStore()
const journal = useJournalStore()

const step = ref(0)
const direction = ref<'forward' | 'back'>('forward')
watch(step, (now, before) => (direction.value = now > before ? 'forward' : 'back'))

const name = ref(auth.user?.name ?? (mode.isDemo ? sampleProfile.name() : null) ?? '')
const birthDate = ref('')
const brand = ref<WearableBrand | null>(null)
const model = ref('')
const prefs = reactive<TrackerPrefs>({ ...journal.prefs })
const goals = reactive<Pick<Goals, GoalKey>>({ steps: fitness.goals.steps, activeKcal: fitness.goals.activeKcal, sleepMin: fitness.goals.sleepMin, waterMl: fitness.goals.waterMl })
const saving = ref(false)
const error = ref<string | null>(null)

const birthDateInvalid = computed(() => !!birthDate.value && !(birthDate.value > '1900-01-01' && birthDate.value < todayIn()))
const wearable = computed<Wearable | null>(() => (brand.value ? { brand: brand.value, model: brand.value === 'other' ? model.value.trim() || null : null } : null))
const visibleGoals = computed(() => GOALS.filter((g) => g.key !== 'waterMl' || prefs.hydration))
const canContinue = computed(() => [name.value.trim() !== '' && birthDate.value !== '' && !birthDateInvalid.value, brand.value !== null, true, true][step.value])

/** A step back; from the first step, sample data returns to the welcome screen (an account stays here). */
function back() {
  if (step.value > 0) step.value--
  else if (mode.isDemo) router.replace('/welcome')
}
// The phone's back button moves between steps instead of leaving setup.
useBackButton(10, back)

function nudge(g: GoalRow, dir: 1 | -1) {
  goals[g.key] = Math.min(g.max, Math.max(g.min, goals[g.key] + dir * g.step))
}

function next() {
  error.value = null
  if (step.value < STEPS - 1) step.value++
  else finish()
}

async function finish() {
  saving.value = true
  error.value = null
  try {
    await Promise.all([fitness.saveGoals({ ...fitness.goals, ...goals }), journal.savePrefs({ ...prefs })])
    if (mode.isDemo) sampleProfile.save(name.value.trim())
    else {
      const user = await authApi.saveProfile({ name: name.value.trim(), birthDate: birthDate.value, wearable: wearable.value })
      auth.user = user
      await tokenStorage.setUser(user)
    }
    onboarding.complete()
    await router.replace('/home')
  } catch (err) {
    error.value = errorMessage(err, 'Could not save your answers. Try again.')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.choice.is-selected {
  background: color-mix(in srgb, var(--accent) 10%, var(--surface));
  box-shadow: inset 0 0 0 2px var(--accent);
}
.badge {
  background: var(--tone-soft);
  color: var(--tone);
}
.check {
  box-shadow: inset 0 0 0 1.5px var(--line-strong);
}
.is-selected .check {
  background: var(--accent);
  color: var(--accent-ink);
  box-shadow: none;
}
.is-selected .dial {
  animation: pop 260ms cubic-bezier(0.23, 1, 0.32, 1);
}
@keyframes pop {
  60% {
    scale: 1.06;
  }
}
.forward-enter-active,
.forward-leave-active,
.back-enter-active,
.back-leave-active {
  transition:
    opacity 200ms ease-out,
    translate 220ms cubic-bezier(0.23, 1, 0.32, 1);
}
.forward-enter-from,
.back-leave-to {
  opacity: 0;
  translate: 16px 0;
}
.forward-leave-to,
.back-enter-from {
  opacity: 0;
  translate: -16px 0;
}
@media (prefers-reduced-motion: reduce) {
  .forward-enter-active,
  .forward-leave-active,
  .back-enter-active,
  .back-leave-active,
  .is-selected .dial {
    transition: opacity 150ms;
    animation: none;
    translate: none;
  }
}
</style>
