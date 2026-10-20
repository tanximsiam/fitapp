<template>
  <AppShell title="Journal">
    <template #subtitle>What you logged, next to what the watch recorded</template>

    <DataState>
      <JournalState>
        <div class="stagger grid grid-cols-[minmax(0,1fr)] gap-4">
          <TodayEntries v-if="anyTracker" />
          <p v-else class="card p-4 text-sm text-ink-2">
            All personal trackers are off. Turn on mood, food or cycle tracking in
            <RouterLink to="/home/settings" class="font-medium text-accent">your profile</RouterLink>.
          </p>

          <section aria-labelledby="recent-title">
            <div class="mb-3 flex items-center justify-between gap-3">
              <h2 id="recent-title" class="text-[17px] font-semibold tracking-tight">Last 7 days</h2>
              <div role="radiogroup" aria-label="Show" class="inline-flex rounded-full bg-surface p-0.5 shadow-[var(--card-shadow)]">
                <button
                  v-for="f in FILTERS"
                  :key="f.value"
                  type="button"
                  role="radio"
                  :aria-checked="filter === f.value"
                  class="min-h-8 rounded-full px-3 text-xs font-medium transition-colors duration-150"
                  :class="filter === f.value ? 'bg-accent text-accent-ink' : 'text-ink-2'"
                  @click="filter = f.value"
                >
                  {{ f.label }}
                </button>
              </div>
            </div>
            <ol class="grid gap-3">
              <li v-for="d in week" :key="d.date" class="card p-4">
                <h3 class="mb-3 text-sm font-semibold">{{ d.date === fitness.today ? 'Today' : formatLongDate(d.date) }}</h3>
                <DayTimeline :rows="d.rows" :empty-text="filter === 'journal' ? 'No entries this day.' : 'Nothing recorded this day.'" />
              </li>
            </ol>
          </section>
        </div>
      </JournalState>
    </DataState>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import DataState from '@/components/DataState.vue'
import DayTimeline from '@/components/DayTimeline.vue'
import JournalState from '@/components/JournalState.vue'
import TodayEntries from '@/components/TodayEntries.vue'
import { useJournalData } from '@/composables/useJournalData'
import { dayRows, type TimelineFilter } from '@/data/timeline'
import { addDays } from '@/lib/dates'
import { formatLongDate } from '@/lib/format'

const FILTERS: { value: TimelineFilter; label: string }[] = [
  { value: 'journal', label: 'Yours' },
  { value: 'all', label: 'All' },
]
const filter = ref<TimelineFilter>('journal')

const { fitness, journal, mode, days } = useJournalData()
const anyTracker = computed(() => journal.prefs.mood || journal.prefs.food || journal.prefs.cycle)

const week = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const date = addDays(fitness.selectedDate, -i)
    return { date, rows: dayRows(days.value.find((d) => d.date === date) ?? null, journal.onDate(date), journal.prefs, mode.isDemo, filter.value) }
  }),
)
</script>
