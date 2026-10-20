<template>
  <!--
    The greeting sits on the page itself. Below it, one slot: the mood question once per part of the day,
    otherwise a daily reminder. Both are the same kind of card, so the page does not jump when one replaces the other.
  -->
  <section aria-labelledby="greeting">
    <h1 id="greeting" class="text-[30px] leading-tight font-semibold tracking-tight">{{ part.greeting }}</h1>

    <Transition name="swap" mode="out-in">
      <div v-if="ask" key="ask" class="card mt-5 p-4">
        <h2 class="text-[15px] font-semibold">How are you feeling {{ part.phrase }}?</h2>
        <ul class="mt-4 grid grid-cols-5 gap-1" aria-label="Choose a mood">
          <li v-for="c in MOOD_CHOICES" :key="c.value">
            <button
              type="button"
              class="flex w-full flex-col items-center gap-1.5 rounded-xl py-1 transition-[scale] duration-150 ease-out active:scale-[0.94] disabled:opacity-50"
              :disabled="saving"
              :aria-label="`${c.label}: log this mood`"
              @click="log(c.value as number)"
            >
              <ChoiceGlyph kind="face" :level="c.value as number" :color="c.color" class="size-11" />
              <span class="text-[11px] text-ink-2">{{ c.label }}</span>
            </button>
          </li>
        </ul>
        <p v-if="error" role="alert" class="mt-3 text-[13px] text-danger">{{ error }}</p>
      </div>

      <div v-else key="reminder" class="card mt-5 flex gap-3 p-4">
        <span class="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent" aria-hidden="true">
          <ion-icon :icon="sparklesOutline" class="text-lg" />
        </span>
        <div class="min-w-0">
          <p class="text-[11px] font-medium tracking-wide text-muted uppercase">Daily reminder</p>
          <p class="mt-1 text-[15px] leading-snug font-medium">{{ reminder }}</p>
          <p v-if="nudge" class="mt-1.5 text-[13px] text-ink-2">{{ nudge }}</p>
        </div>
      </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { IonIcon } from '@ionic/vue'
import { sparklesOutline } from 'ionicons/icons'
import ChoiceGlyph from '@/components/forms/ChoiceGlyph.vue'
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

/** Ask once per part of the day: hidden as soon as a mood exists since this part began. */
const ask = computed(() => {
  if (!journal.loaded || !journal.prefs.mood) return false
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
  if (reached === 3) return 'All three goals reached today.'
  if (a?.steps != null && a.steps < g.steps) {
    const left = Math.ceil((g.steps - a.steps) / 100) * 100
    // ~100 steps a minute is a typical walking cadence.
    return `${formatInt(left)} steps to your goal, about a ${Math.max(5, Math.round(left / 100 / 5) * 5)}-minute walk.`
  }
  const streak = loggingStreak(journal.data, fitness.today)
  return streak > 2 ? `${streak} days of logging in a row.` : null
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
