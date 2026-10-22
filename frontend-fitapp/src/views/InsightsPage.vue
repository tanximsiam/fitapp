<template>
  <AppShell title="Insights">
    <template #subtitle>{{ fitness.rangeDays }} complete days, {{ formatShortDate(window.from) }}–{{ formatShortDate(window.to) }}</template>
    <template #actions><RangeTabs :model-value="fitness.rangeDays" @update:model-value="fitness.setRange" /></template>

    <DataState>
      <JournalState>
        <div class="stagger grid gap-6">
          <ScoreHero v-if="score" :score="score" :coach="coach" :period="`${formatShortDate(addDays(fitness.today, -7))}–${formatShortDate(addDays(fitness.today, -1))}`" />

          <!-- Patterns across areas, written by the coach from the days in the range. -->
          <section aria-labelledby="ai-title" class="@container">
            <h2 id="ai-title" class="mb-3 text-base font-semibold tracking-tight">For you</h2>
            <ul class="grid gap-4" :class="COLUMNS[Math.max(ai.items.length, ai.loading ? 3 : 1)]" aria-live="polite">
              <template v-if="ai.loading">
                <li v-for="n in 3" :key="n" class="card h-40 animate-pulse p-5" aria-hidden="true" />
                <li class="sr-only">Reading your last {{ fitness.rangeDays }} days…</li>
              </template>
              <li v-for="i in ai.loading ? [] : ai.items" :key="i.title" class="card flex flex-col p-5" :class="`tone-${AREAS[i.area].tone}`">
                <span class="badge grid size-8 place-items-center rounded-lg" aria-hidden="true"><ion-icon :icon="AREAS[i.area].icon" class="text-[17px]" /></span>
                <p class="mt-3 text-[15px] font-semibold tracking-tight">{{ i.title }}</p>
                <p class="mt-1 text-sm leading-relaxed text-ink-2">{{ i.body }}</p>
                <p v-if="i.action" class="mt-auto flex items-start gap-1.5 pt-3 text-sm font-medium text-accent">
                  <ion-icon :icon="arrowForwardCircleOutline" aria-hidden="true" class="mt-0.5 shrink-0" />{{ i.action }}
                </p>
              </li>
              <li v-if="!ai.loading && !ai.items.length" class="card p-5 text-sm text-muted">There are not enough records in this period to connect areas yet.</li>
            </ul>
          </section>

          <div class="@container">
            <div class="grid items-start gap-4 @4xl:grid-cols-3">
              <section class="card p-5 @4xl:col-span-2" aria-labelledby="found-title">
                <h2 id="found-title" class="text-[15px] font-semibold tracking-tight">What your records show <span class="font-normal text-muted">· {{ supported.length }}</span></h2>
                <p v-if="!supported.length" class="mt-3 text-sm text-muted">There are not enough records in this period for any observation yet.</p>
                <ul v-else class="mt-2 divide-y divide-line">
                  <InsightRow v-for="i in supported" :key="i.id" :insight="i" />
                </ul>
                <details v-if="withheld.length" class="mt-2 border-t border-line pt-3">
                  <summary class="cursor-pointer text-sm font-medium text-accent select-none">Not enough data yet · {{ withheld.length }}</summary>
                  <ul class="mt-1 divide-y divide-line">
                    <InsightRow v-for="i in withheld" :key="i.id" :insight="i" />
                  </ul>
                  <p class="mt-2 text-xs leading-relaxed text-muted">FitApp makes a statement only once it has the minimum number of days for it.</p>
                </details>
              </section>

              <div class="grid gap-4">
                <!-- The coach's reaction to the newest entry from the mobile app. -->
                <section v-if="latest" class="card p-5" aria-labelledby="latest-title">
                  <div class="flex items-center gap-2.5">
                    <span class="grid size-8 bg-accent-soft text-accent shrink-0 place-items-center rounded-lg" aria-hidden="true"><ion-icon :icon="chatbubbleEllipsesOutline" class="text-[17px]" /></span>
                    <h2 id="latest-title" class="text-[15px] font-semibold tracking-tight">On your latest entry</h2>
                  </div>
                  <p class="mt-3 text-xs text-muted">{{ latest.label }} · {{ formatShortDate(latest.at.slice(0, 10)) }}, {{ formatClock(latest.at) }}</p>
                  <p class="mt-1.5 text-sm leading-relaxed" aria-live="polite">{{ feedback ?? '…' }}</p>
                </section>

                <section class="card p-5" aria-labelledby="coverage-title">
                  <h2 id="coverage-title" class="text-[15px] font-semibold tracking-tight">Data coverage</h2>
                  <dl class="mt-3 grid grid-cols-2 gap-x-6 gap-y-4">
                    <div v-for="c in coverage" :key="c.area" class="min-w-0">
                      <dt class="text-xs text-muted">{{ c.area }}</dt>
                      <dd class="tabular mt-0.5 text-sm font-medium">{{ c.count }} / {{ c.total }} days</dd>
                      <div class="mt-1 h-1 rounded-full bg-line" aria-hidden="true">
                        <div class="h-full rounded-full bg-accent" :style="{ width: `${(c.count / c.total) * 100}%` }" />
                      </div>
                    </div>
                  </dl>
                </section>
              </div>
            </div>
          </div>

          <p class="text-xs leading-relaxed text-muted">
            Observations are calculated from the records shown, with fixed rules; the coach writes from numbers and categories, never your notes. These are associations in your own records, never causes, diagnoses or medical advice.
          </p>
        </div>
      </JournalState>
    </DataState>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { IonIcon } from '@ionic/vue'
import { arrowForwardCircleOutline, chatbubbleEllipsesOutline, sparklesOutline } from 'ionicons/icons'
import { aiCoach, aiFeedback, aiInsights, fromAi, type AiCoach, type AiInsight } from '@/api/ai'
import AppShell from '@/components/AppShell.vue'
import DataState from '@/components/DataState.vue'
import InsightRow from '@/components/InsightRow.vue'
import JournalState from '@/components/JournalState.vue'
import RangeTabs from '@/components/RangeTabs.vue'
import ScoreHero from '@/components/ScoreHero.vue'
import { ICONS } from '@/components/metricIcons'
import type { Tone } from '@/components/PanelSection.vue'
import { useJournalData } from '@/composables/useJournalData'
import { activityTitle } from '@/data/activities'
import { fallbackCoach, fallbackFeedback, fallbackInsights } from '@/data/aiFallback'
import { coachPayload, entryPayload, insightsPayload, todayPayload, type SavedEntry } from '@/data/aiPayload'
import { healthScore } from '@/data/healthScore'
import { MOOD_LABELS } from '@/data/journalDerive'
import { analyse, completeness } from '@/insights/engine'
import { addDays } from '@/lib/dates'
import { formatClock, formatShortDate } from '@/lib/format'

/** The statements a person checks first lead the list. */
const LEAD = ['activity-goal', 'sleep-average', 'energy-sleep', 'mood-average', 'stress-average', 'resting-hr']
const COLUMNS: Record<number, string> = { 1: '', 2: '@3xl:grid-cols-2', 3: '@3xl:grid-cols-3' }
const AREAS: Record<AiInsight['area'], { tone: Tone; icon: string }> = {
  activity: { tone: 'activity', icon: ICONS.activity },
  sleep: { tone: 'sleep', icon: ICONS.sleep },
  heart: { tone: 'heart', icon: ICONS.heartRate },
  stress: { tone: 'stress', icon: ICONS.stress },
  mood: { tone: 'mood', icon: ICONS.mood },
  food: { tone: 'energy', icon: ICONS.meals },
  hydration: { tone: 'activity', icon: ICONS.water },
  cycle: { tone: 'mood', icon: ICONS.cycle },
  general: { tone: 'activity', icon: sparklesOutline },
}

const { fitness, journal } = useJournalData()

// A part-finished today would distort averages, so the analysis ends at the last complete day.
const window = computed(() => {
  const to = fitness.isToday ? addDays(fitness.selectedDate, -1) : fitness.selectedDate
  return { from: addDays(to, 1 - fitness.rangeDays), to }
})
const insights = computed(() =>
  analyse({ days: fitness.days, journal: journal.data, goals: fitness.goals, prefs: journal.prefs, end: window.value.to, windowDays: fitness.rangeDays }),
)
const rank = (id: string) => (LEAD.includes(id) ? LEAD.indexOf(id) : LEAD.length)
const supported = computed(() => insights.value.filter((i) => i.status === 'ok').sort((a, b) => rank(a.id) - rank(b.id)))
const withheld = computed(() => insights.value.filter((i) => i.status !== 'ok'))
const coverage = computed(() => completeness(fitness.days, journal.data, window.value.from, window.value.to, journal.prefs))

/** The same week score and coach text as on the phone (the server answers the same question from its cache). */
const score = computed(() => healthScore(fitness.days, journal.data, fitness.today, journal.prefs.hydration ? fitness.goals.waterMl : null))
const today = computed(() => todayPayload(fitness.today, fitness.days, journal.data, fitness.goals))
const coach = ref<AiCoach | null>(null)
watch(
  () => (score.value ? JSON.stringify(coachPayload(score.value, today.value)) : null),
  async (key) => {
    if (!key || !score.value) return
    const s = score.value
    coach.value = await fromAi(() => aiCoach(JSON.parse(key)), fallbackCoach(s))
  },
  { immediate: true },
)

const ai = reactive({ loading: false, items: [] as AiInsight[] })
watch(
  () => (journal.loaded && fitness.loaded ? `${window.value.to}:${fitness.rangeDays}` : null),
  async (key) => {
    if (!key) return
    ai.loading = true
    const summary = insightsPayload(window.value.to, fitness.rangeDays, fitness.days, journal.data, fitness.goals)
    const written = await fromAi(() => aiInsights(summary), [])
    ai.items = written.length ? written : fallbackInsights(summary)
    ai.loading = false
  },
  { immediate: true },
)

/** The newest entry of any kind, with the words the coach reacts to. */
const latest = computed(() => {
  const d = journal.data
  const all: (SavedEntry & { at: string; label: string })[] = [
    ...d.mood.map((e) => ({ kind: 'mood' as const, input: e, at: e.recordedAt, label: `Mood check-in: ${MOOD_LABELS[e.mood - 1] ?? e.mood}` })),
    ...d.meals.map((e) => ({ kind: 'meal' as const, input: e, at: e.eatenAt, label: `${e.mealType[0].toUpperCase()}${e.mealType.slice(1)}: ${e.items.map((i) => i.name).join(', ')}` })),
    ...d.hydration.map((e) => ({ kind: 'drink' as const, input: e, at: e.recordedAt, label: `Water: ${e.volumeMl} ml` })),
    ...d.activities.map((e) => ({ kind: 'activity' as const, input: e, at: e.startedAt, label: `${activityTitle(e)}: ${e.durationMin} min` })),
  ]
  return all.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0] ?? null
})
const feedback = ref<string | null>(null)
watch(
  () => latest.value && `${latest.value.kind}:${latest.value.input.id}`,
  async (key) => {
    const e = latest.value
    if (!key || !e) return
    feedback.value = null
    feedback.value = await fromAi(() => aiFeedback(e.kind, entryPayload(e), today.value), fallbackFeedback(e))
  },
  { immediate: true },
)
</script>

<style scoped>
/* Cards stay white; only the icon badge takes the area's tint (tone-* sets the variables). */
.card {
  background: var(--surface);
}
.badge {
  background: var(--tone-soft);
  color: var(--tone-icon);
}
</style>
