<template>
  <AppShell title="Mood">
    <template #subtitle>{{ formatLongDate(fitness.selectedDate) }} · your own check-ins</template>
    <template #actions>
      <PrimaryButton label="Log mood" @click="ui.openQuickLog('mood')" />
    </template>

    <TrackerGate tracker="mood">
      <DateToolbar />
      <JournalState>
        <div class="grid gap-4">
          <PanelSection :title="fitness.isToday ? 'Today' : 'This day'">
            <ul v-if="entries.length" class="divide-y divide-line border-y border-line">
              <li v-for="e in entries" :key="e.id" class="py-3">
                <MoodForm v-if="editing === e.id" :date="e.date" :existing="e" @done="editing = null" />
                <div v-else class="flex flex-wrap items-start gap-x-6 gap-y-1 text-sm">
                  <span class="tabular w-12 text-ink-2">{{ formatClock(e.recordedAt) }}</span>
                  <div class="min-w-0 flex-1">
                    <p>
                      <span class="font-medium">Mood {{ e.mood }}/5</span> <span class="text-ink-2">{{ MOOD_LABELS[e.mood - 1] }}</span>
                      <template v-if="e.energy"> · energy {{ e.energy }}/5</template>
                      <template v-if="e.stress"> · stress you felt {{ e.stress }}/5</template>
                    </p>
                    <p v-if="e.emotions.length" class="mt-0.5 text-ink-2">{{ e.emotions.join(', ') }}</p>
                    <p v-if="e.note" class="mt-1 text-ink-2 italic">“{{ e.note }}”</p>
                  </div>
                  <EntryBadge :kind="e.provenance" />
                  <button type="button" class="text-xs font-medium text-accent underline underline-offset-2" @click="editing = e.id">Edit</button>
                </div>
              </li>
            </ul>
            <p v-else class="text-sm text-muted">No check-in on this day.</p>
            <div v-if="adding" class="mt-4 border-t border-line pt-4"><MoodForm :date="fitness.selectedDate" @done="adding = false" /></div>
            <button v-else type="button" class="mt-4 text-sm font-medium text-accent underline underline-offset-2" @click="adding = true">Add a check-in for this day</button>
          </PanelSection>

          <PanelSection :title="`Last ${fitness.rangeDays} days`">
            <dl class="mb-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              <MetricItem label="Days with a check-in" :value="`${moodByDay.size} of ${fitness.rangeDays}`" />
              <MetricItem label="Average mood" :value="avgText(mean([...moodByDay.values()]))" />
              <MetricItem label="Average energy" :value="avgText(mean([...energyByDay.values()]))" />
              <MetricItem label="Average stress you felt" :value="avgText(mean([...stressByDay.values()]))" />
            </dl>
            <h3 class="mb-1 text-sm font-semibold">Mood</h3>
            <LineChart v-bind="lineProps(moodByDay)" color="var(--sleep)" description="Daily average mood, 1 to 5" :height="150" />
            <h3 class="mt-5 mb-1 text-sm font-semibold">Energy</h3>
            <LineChart v-bind="lineProps(energyByDay)" color="var(--activity)" description="Daily average energy, 1 to 5" :height="150" />
            <div v-if="emotionCounts.length" class="mt-5">
              <h3 class="mb-2 text-sm font-semibold">Most logged emotions</h3>
              <ul class="flex flex-wrap gap-2 text-sm">
                <li v-for="[name, count] in emotionCounts" :key="name" class="rounded-full border border-line px-3 py-1">
                  {{ name }} <span class="tabular text-muted">{{ count }}</span>
                </li>
              </ul>
            </div>
          </PanelSection>
        </div>
      </JournalState>
    </TrackerGate>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import LineChart from '@/components/charts/LineChart.vue'
import DateToolbar from '@/components/DateToolbar.vue'
import EntryBadge from '@/components/EntryBadge.vue'
import MoodForm from '@/components/forms/MoodForm.vue'
import JournalState from '@/components/JournalState.vue'
import MetricItem from '@/components/MetricItem.vue'
import PanelSection from '@/components/PanelSection.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import TrackerGate from '@/components/TrackerGate.vue'
import { useJournalData } from '@/composables/useJournalData'
import { dailyTicks } from '@/data/chartData'
import { mean } from '@/data/derive'
import { MOOD_LABELS, dailyMoodMean, topCounts } from '@/data/journalDerive'
import { EMPTY, formatClock, formatLongDate, formatShortDate, formatWeekday } from '@/lib/format'
import { useUiStore } from '@/stores/ui'
import type { EntryId } from '@/types/journal'
import type { ISODate } from '@/types/fitness'

const { fitness, journal, rangeDaysList } = useJournalData()
const ui = useUiStore()
const editing = ref<EntryId | null>(null)
const adding = ref(false)

const entries = computed(() => journal.onDate(fitness.selectedDate).mood)
const rangeEntries = computed(() => {
  const first = rangeDaysList.value[0]?.date ?? fitness.selectedDate
  return journal.data.mood.filter((e) => e.date >= first && e.date <= fitness.selectedDate)
})
const moodByDay = computed(() => dailyMoodMean(rangeEntries.value, (e) => e.mood))
const energyByDay = computed(() => dailyMoodMean(rangeEntries.value, (e) => e.energy))
const stressByDay = computed(() => dailyMoodMean(rangeEntries.value, (e) => e.stress))
const emotionCounts = computed(() => topCounts(rangeEntries.value.flatMap((e) => e.emotions)))
const avgText = (v: number | null) => (v == null ? EMPTY : `${v.toFixed(1)} / 5`)

function lineProps(byDay: Map<ISODate, number>) {
  const days = rangeDaysList.value
  return {
    points: days.map((d, i) => ({ x: i, label: `${formatWeekday(d.date)}, ${formatShortDate(d.date)}`, value: byDay.has(d.date) ? Math.round(byDay.get(d.date)! * 10) / 10 : null })),
    xDomain: [0, Math.max(1, days.length - 1)] as [number, number],
    xTicks: dailyTicks(days),
    markX: days.length - 1,
    unit: '/ 5',
    xName: 'Date',
    maxGap: 1,
    yDomain: [1, 5] as [number, number],
  }
}
</script>
