<template>
  <AppShell title="Journal">
    <template #subtitle>What you logged, next to what the watch recorded</template>

    <DataState>
      <JournalState>
        <div class="stagger grid grid-cols-[minmax(0,1fr)] gap-4">
          <SyncIssues />
          <TodayEntries v-if="anyTracker" />
          <p v-else class="card p-4 text-sm text-ink-2">
            All personal trackers are off. Turn on mood, food or cycle tracking in
            <RouterLink to="/home/settings" class="font-medium text-accent">your profile</RouterLink>.
          </p>

          <section aria-labelledby="history-title">
            <h2 id="history-title" class="mb-3 text-[17px] font-semibold tracking-tight">History</h2>
            <!-- Category chips scroll sideways rather than wrapping, so the list keeps its place. -->
            <div role="radiogroup" aria-label="Show" class="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
              <button
                v-for="c in categories"
                :key="c.value"
                type="button"
                role="radio"
                :aria-checked="category === c.value"
                class="flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors duration-150"
                :class="category === c.value ? 'bg-accent text-accent-ink' : 'bg-surface text-ink-2 shadow-[var(--card-shadow)]'"
                @click="category = c.value"
              >
                <ion-icon v-if="c.icon" :icon="c.icon" aria-hidden="true" />{{ c.label }}
              </button>
            </div>

            <ol id="journal-days" class="grid gap-3">
              <li v-for="d in shownDays" :key="d.date" class="card p-4">
                <h3 class="mb-3 text-sm font-semibold">{{ d.date === fitness.today ? 'Today' : formatLongDate(d.date) }}</h3>
                <DayTimeline :rows="d.rows" :empty-text="emptyText" />
              </li>
            </ol>
            <button
              v-if="visible < DAYS_LOADED"
              type="button"
              aria-controls="journal-days"
              class="mt-3 min-h-11 w-full rounded-full text-sm font-medium text-accent"
              @click="visible += 7"
            >
              Show earlier days
            </button>
          </section>
        </div>
      </JournalState>
    </DataState>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IonIcon } from '@ionic/vue'
import { watchOutline } from 'ionicons/icons'
import AppShell from '@/components/AppShell.vue'
import DataState from '@/components/DataState.vue'
import DayTimeline from '@/components/DayTimeline.vue'
import JournalState from '@/components/JournalState.vue'
import SyncIssues from '@/components/SyncIssues.vue'
import TodayEntries from '@/components/TodayEntries.vue'
import { ICONS } from '@/components/metricIcons'
import { useJournalData } from '@/composables/useJournalData'
import { dayRows } from '@/data/timeline'
import { addDays } from '@/lib/dates'
import { formatLongDate } from '@/lib/format'

type Category = 'all' | 'mood' | 'meals' | 'water' | 'activities' | 'cycle' | 'watch'
/** Timeline areas shown for each category ('all' shows everything). */
const AREAS: Record<Exclude<Category, 'all'>, string[]> = {
  mood: ['Mood'],
  meals: ['Meal'],
  water: ['Water'],
  activities: ['Logged activity'],
  cycle: ['Period'],
  watch: ['Sleep', 'Workout', 'Activity'],
}
/** The journal store loads 60 days; older days need a reload from an earlier date. */
const DAYS_LOADED = 60

const { fitness, journal, mode, days } = useJournalData()
const anyTracker = computed(() => Object.values(journal.prefs).some(Boolean))

const categories = computed(() =>
  [
    { value: 'all' as const, label: 'All', icon: null, on: true },
    { value: 'mood' as const, label: 'Mood', icon: ICONS.mood, on: journal.prefs.mood },
    { value: 'meals' as const, label: 'Meals', icon: ICONS.meals, on: journal.prefs.food },
    { value: 'water' as const, label: 'Water', icon: ICONS.water, on: journal.prefs.hydration },
    { value: 'activities' as const, label: 'Activities', icon: ICONS.workouts, on: true },
    { value: 'cycle' as const, label: 'Periods', icon: ICONS.cycle, on: journal.prefs.cycle },
    { value: 'watch' as const, label: 'Watch', icon: watchOutline, on: true },
  ].filter((c) => c.on),
)
const category = ref<Category>('all')
// A tracker turned off in settings removes its chip; fall back to everything.
watch(categories, (cs) => {
  if (!cs.some((c) => c.value === category.value)) category.value = 'all'
})

const visible = ref(7)
watch(category, () => (visible.value = 7))

const shownDays = computed(() =>
  Array.from({ length: visible.value }, (_, i) => {
    const date = addDays(fitness.selectedDate, -i)
    const rows = dayRows(days.value.find((d) => d.date === date) ?? null, journal.onDate(date), journal.prefs, mode.isDemo)
    const c = category.value
    return { date, rows: c === 'all' ? rows : rows.filter((r) => AREAS[c].includes(r.area)) }
  }),
)
const emptyText = computed(() => (category.value === 'all' ? 'Nothing recorded this day.' : 'Nothing in this category this day.'))
</script>
