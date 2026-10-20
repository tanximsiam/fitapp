<template>
  <!-- A bottom sheet: a short, focused entry that returns to where the user was. Swipe down or tap outside to close. -->
  <ion-modal
    :is-open="!!ui.quickLog"
    :initial-breakpoint="1"
    :breakpoints="[0, 1]"
    class="sheet"
    aria-labelledby="quick-log-title"
    @will-present="onOpen"
    @will-dismiss="ui.closeQuickLog()"
  >
    <div class="max-h-[88dvh] overflow-y-auto px-5 pt-4 pb-[max(env(safe-area-inset-bottom),20px)]">
      <div class="mb-4 flex items-center justify-between">
        <h2 id="quick-log-title" class="text-lg font-semibold tracking-tight">{{ saved ? 'Saved' : 'Quick log' }}</h2>
        <button type="button" class="grid size-9 place-items-center rounded-full text-ink-2 hover:bg-page" aria-label="Close" @click="close">
          <ion-icon :icon="closeOutline" aria-hidden="true" class="text-xl" />
        </button>
      </div>

      <div v-if="saved" class="flex flex-col items-center py-6 text-center" role="status">
        <svg class="success size-20" viewBox="0 0 80 80" aria-hidden="true">
          <circle cx="40" cy="40" r="36" class="ring" />
          <path d="M25 41 l10 10 l20 -22" class="tick" />
        </svg>
        <p class="mt-4 text-xl font-semibold tracking-tight">{{ SAVED_TEXT[saved] }}</p>
        <p v-if="streak > 1" class="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-2">
          <ion-icon :icon="flameOutline" aria-hidden="true" :style="{ color: 'var(--energy)' }" />{{ streak }}-day logging streak. Keep it going!
        </p>
        <p v-else class="mt-1 text-sm text-ink-2">Every entry makes your overview more useful.</p>
        <div class="mt-6 flex gap-2">
          <PrimaryButton variant="secondary" label="Log something else" @click="choose" />
          <PrimaryButton label="Done" @click="close" />
        </div>
      </div>

      <template v-else-if="ui.quickLog === 'choose'">
        <p class="mb-4 text-sm text-ink-2">
          What would you like to log?<span class="text-muted"> Saved as your own entry{{ mode.isDemo ? ' on this device (demo)' : '' }}.</span>
        </p>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="(t, i) in tabs"
            :key="t.kind"
            type="button"
            class="tone chooser flex min-h-36 flex-col items-start rounded-2xl p-4 text-left transition-[translate,box-shadow,scale] duration-200 ease-out active:scale-[0.97]"
            :class="`tone-${t.tone}`"
            :style="{ animationDelay: `${i * 40}ms` }"
            @click="ui.quickLog = t.kind"
          >
            <span class="grid size-11 place-items-center rounded-full bg-surface shadow-sm" :style="{ color: 'var(--tone)' }">
              <ion-icon :icon="t.icon" aria-hidden="true" class="text-2xl" />
            </span>
            <span class="mt-auto pt-4 text-base font-semibold text-ink">{{ t.label }}</span>
            <span class="text-xs">{{ t.hint }}</span>
          </button>
        </div>
      </template>

      <template v-else-if="ui.quickLog">
        <MoodSteps v-if="ui.quickLog === 'mood'" :key="`m${openCount}`" :date="fitness.today" @exit="choose" @saved="onSaved" />
        <MealSteps v-else-if="ui.quickLog === 'meal'" :key="`f${openCount}`" :date="fitness.today" @exit="choose" @saved="onSaved" />
        <DrinkSteps v-else-if="ui.quickLog === 'drink'" :key="`d${openCount}`" :date="fitness.today" @exit="choose" @saved="onSaved" />
        <CycleSteps v-else :key="`c${openCount}`" :date="fitness.today" @exit="choose" @saved="onSaved" />
      </template>
    </div>
  </ion-modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { Haptics, NotificationType } from '@capacitor/haptics'
import { IonIcon, IonModal } from '@ionic/vue'
import { closeOutline, flameOutline } from 'ionicons/icons'
import { ICONS } from '@/components/metricIcons'
import type { Tone } from '@/components/PanelSection.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import CycleSteps from '@/components/quicklog/CycleSteps.vue'
import DrinkSteps from '@/components/quicklog/DrinkSteps.vue'
import MealSteps from '@/components/quicklog/MealSteps.vue'
import MoodSteps from '@/components/quicklog/MoodSteps.vue'
import { loggingStreak } from '@/data/journalDerive'
import { useFitnessStore } from '@/stores/fitness'
import { useJournalStore } from '@/stores/journal'
import { useModeStore } from '@/stores/mode'
import { useUiStore, type LogKind } from '@/stores/ui'

const SAVED_TEXT: Record<LogKind, string> = { mood: 'Mood logged', meal: 'Meal logged', drink: 'Drink logged', cycle: 'Cycle day saved' }

const ui = useUiStore()
const journal = useJournalStore()
const fitness = useFitnessStore()
const mode = useModeStore()
const openCount = ref(0)
const saved = ref<LogKind | null>(null)
const streak = computed(() => loggingStreak(journal.data, fitness.today))

const tabs = computed(() =>
  (
    [
      { kind: 'mood', label: 'Mood', hint: 'How you feel', icon: ICONS.mood, tone: 'mood', on: journal.prefs.mood },
      { kind: 'meal', label: 'Meal', hint: 'Foods and nutrients', icon: ICONS.meals, tone: 'energy', on: journal.prefs.food },
      { kind: 'drink', label: 'Drink', hint: 'Water you drank', icon: ICONS.water, tone: 'activity', on: journal.prefs.food },
      { kind: 'cycle', label: 'Cycle', hint: 'Flow and symptoms', icon: ICONS.cycle, tone: 'spo2', on: journal.prefs.cycle },
    ] as { kind: LogKind; label: string; hint: string; icon: string; tone: Tone; on: boolean }[]
  ).filter((t) => t.on),
)

function onOpen() {
  const kind = ui.quickLog
  if (kind && kind !== 'choose' && !tabs.value.some((t) => t.kind === kind)) ui.quickLog = 'choose'
  saved.value = null
  openCount.value++
  journal.ensureLoaded()
}

function choose() {
  saved.value = null
  openCount.value++
  ui.quickLog = 'choose'
}
function onSaved() {
  saved.value = ui.quickLog === 'choose' ? null : ui.quickLog
  if (Capacitor.isNativePlatform()) Haptics.notification({ type: NotificationType.Success }).catch(() => {})
}
const close = () => ui.closeQuickLog()
</script>

<style scoped>
.chooser {
  animation: rise 260ms cubic-bezier(0.23, 1, 0.32, 1) both;
}
@media (hover: hover) {
  .chooser:hover {
    translate: 0 -2px;
    box-shadow: 0 10px 24px -12px color-mix(in srgb, var(--tone) 60%, transparent);
  }
}
@keyframes rise {
  from {
    opacity: 0;
    translate: 0 8px;
  }
}
.success .ring {
  fill: color-mix(in srgb, var(--stress) 14%, transparent);
  stroke: var(--stress);
  stroke-width: 4;
  stroke-dasharray: 227;
  stroke-dashoffset: 227;
  animation: draw 420ms cubic-bezier(0.23, 1, 0.32, 1) forwards;
}
.success .tick {
  fill: none;
  stroke: var(--stress);
  stroke-width: 6;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: draw 260ms 300ms ease-out forwards;
}
@keyframes draw {
  to {
    stroke-dashoffset: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .success .ring,
  .success .tick {
    stroke-dashoffset: 0;
  }
}
</style>
