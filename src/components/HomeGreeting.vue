<template>
  <!--
    The greeting sits on the page itself. Below it, one slot that is the page's single hero: the mood check-in once
    per part of the day, otherwise the daily reminder. Solid brand teal with white type (teal 800 in dark mode),
    the only coloured surface on Home, so it is where the eye lands first.
  -->
  <section aria-labelledby="greeting">
    <WeekStrip class="mb-6" />
    <h1 id="greeting" class="text-[30px] leading-tight font-semibold tracking-tight">{{ part.greeting }}</h1>

    <Transition name="swap" mode="out-in">
      <div v-if="ask" key="ask" class="hero-panel relative mt-5 rounded-3xl px-5 pt-5 pb-4">
        <button
          type="button"
          class="absolute top-2.5 right-2.5 grid size-10 place-items-center rounded-full text-ink-2 transition-colors duration-150 active:bg-white/15"
          aria-label="Not now"
          @click="dismiss"
        >
          <ion-icon :icon="close" aria-hidden="true" class="text-xl" />
        </button>
        <h2 class="pr-8 text-[20px] leading-snug font-semibold tracking-tight">How are you feeling {{ part.phrase }}?</h2>
        <ul class="mt-5 grid grid-cols-5 gap-1.5" aria-label="Choose a mood">
          <li v-for="c in MOOD_CHOICES" :key="c.value">
            <button
              type="button"
              class="group flex w-full flex-col items-center gap-2 rounded-2xl py-1.5 disabled:opacity-60"
              :disabled="saving"
              :aria-label="`${c.label}: log this mood`"
              @click="log(c.value)"
            >
              <!-- A light plate lifts each face off the teal; the face rises a little under the finger. -->
              <span class="grid size-[52px] place-items-center rounded-full bg-white/90 transition-[translate,scale] duration-200 ease-out group-active:-translate-y-1 group-active:scale-105">
                <ChoiceGlyph kind="face" :level="c.value" :color="c.color" class="size-10" />
              </span>
              <span class="text-[11px] font-medium text-ink-2">{{ c.label }}</span>
            </button>
          </li>
        </ul>
        <p v-if="error" role="alert" class="mt-3 rounded-xl bg-black/20 px-3 py-2 text-[13px]">{{ error }}</p>
      </div>

      <div v-else key="reminder" class="hero-panel relative mt-5 overflow-hidden rounded-3xl p-5">
        <!-- Typographic accent, not decoration: a large faint quotation mark behind the reminder. -->
        <span class="pointer-events-none absolute -top-6 right-3 font-serif text-[140px] leading-none text-white/15 select-none" aria-hidden="true">&ldquo;</span>
        <p class="flex items-center gap-1.5 text-[12px] font-medium tracking-wide text-ink-2 uppercase">
          <ion-icon :icon="sparklesOutline" aria-hidden="true" class="text-sm" />Daily reminder
        </p>
        <p class="relative mt-2 pr-6 text-[22px] leading-snug font-semibold tracking-tight">{{ reminder }}</p>
        <p v-if="nudge" class="mt-4 flex items-center gap-2 border-t border-white/20 pt-3 text-[13px] text-ink-2">
          <ion-icon :icon="nudge.icon" aria-hidden="true" class="shrink-0 text-base" />{{ nudge.text }}
        </p>
      </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { IonIcon } from '@ionic/vue'
import { checkmarkCircleOutline, close, flameOutline, footstepsOutline, sparklesOutline } from 'ionicons/icons'
import ChoiceGlyph from '@/components/forms/ChoiceGlyph.vue'
import WeekStrip from '@/components/WeekStrip.vue'
import { MOOD_CHOICES } from '@/components/forms/choices'
import { progress } from '@/data/derive'
import { loggingStreak } from '@/data/journalDerive'
import { dayPart } from '@/lib/dayPart'
import { formatInt } from '@/lib/format'
import { localInputToIso } from '@/lib/instants'
import { useFitnessStore } from '@/stores/fitness'
import { useJournalStore } from '@/stores/journal'
import type { DaySummary } from '@/types/fitness'

/** Encouragement about movement, rest and routine; never medical advice. One per day, same all day. */
const REMINDERS = [
  'Small steps add up. A short walk still counts.',
  'Rest is part of progress, too.',
  "You don't need a perfect day, just a good next step.",
  'Consistency beats intensity.',
  'A glass of water is an easy win right now.',
  'Stand up and stretch for a minute.',
  "Showing up is the hardest part, and you're here.",
]

const props = defineProps<{ day: DaySummary | null | undefined }>()
const fitness = useFitnessStore()
const journal = useJournalStore()

// Re-evaluate the part of the day every minute, so the question returns when the next part starts.
const now = ref(new Date())
const timer = setInterval(() => (now.value = new Date()), 60_000)
onBeforeUnmount(() => clearInterval(timer))
const part = computed(() => dayPart(now.value))

/** "Not now" lasts until the next part of the day; kept across restarts so the question does not come straight back. */
const DISMISS_KEY = 'fitapp.checkin.dismissed'
const readDismissed = () => {
  try {
    return localStorage.getItem(DISMISS_KEY)
  } catch {
    return null
  }
}
const dismissed = ref(readDismissed())
function dismiss() {
  dismissed.value = part.value.start.toISOString()
  try {
    localStorage.setItem(DISMISS_KEY, dismissed.value)
  } catch {
    // Storage unavailable: dismissed for this session only.
  }
}

/** Ask once per part of the day: hidden once a mood exists since this part began, or after "Not now". */
const ask = computed(() => {
  if (!journal.loaded || !journal.prefs.mood) return false
  if (dismissed.value === part.value.start.toISOString()) return false
  const since = part.value.start.getTime()
  return !journal.data.mood.some((e) => Date.parse(e.recordedAt) >= since)
})

const saving = ref(false)
const error = ref<string | null>(null)
async function log(mood: number) {
  saving.value = true
  error.value = null
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  try {
    // A one-tap check-in; energy, stress, emotions and a note can be added later on the Mood page.
    await journal.saveMood({
      recordedAt: localInputToIso(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`),
      mood,
      energy: null,
      stress: null,
      emotions: [],
      note: null,
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Could not save your mood.'
  } finally {
    saving.value = false
  }
}

const reminder = computed(() => {
  const dayNumber = Math.floor(Date.parse(`${fitness.today}T00:00:00Z`) / 86_400_000)
  return REMINDERS[dayNumber % REMINDERS.length]
})

/** One line from the person's own day, when there is something worth saying. */
const nudge = computed(() => {
  const g = fitness.goals
  const a = props.day?.activity
  const reached = [progress(a?.steps, g.steps), progress(a?.activeKcal, g.activeKcal), progress(props.day?.sleep?.durationMin, g.sleepMin)].filter(
    (r) => r != null && r >= 1,
  ).length
  if (reached === 3) return { icon: checkmarkCircleOutline, text: 'All three goals reached today.' }
  if (a?.steps != null && a.steps < g.steps) {
    const left = Math.ceil((g.steps - a.steps) / 100) * 100
    // ~100 steps a minute is a typical walking cadence.
    return { icon: footstepsOutline, text: `${formatInt(left)} steps to your goal, about a ${Math.max(5, Math.round(left / 100 / 5) * 5)}-minute walk.` }
  }
  const streak = loggingStreak(journal.data, fitness.today)
  return streak > 2 ? { icon: flameOutline, text: `${streak} days of logging in a row.` } : null
})
</script>

<style scoped>
.swap-enter-active,
.swap-leave-active {
  transition:
    opacity 200ms ease-out,
    translate 200ms cubic-bezier(0.23, 1, 0.32, 1);
}
.swap-enter-from {
  opacity: 0;
  translate: 0 6px;
}
.swap-leave-to {
  opacity: 0;
}
</style>
