<template>
  <AppShell title="Mood" clear-fab>
    <template #subtitle>{{ formatLongDate(fitness.selectedDate) }} · your own check-ins</template>
    <TrackerGate tracker="mood">
      <DateToolbar />
      <JournalState>
        <div class="grid gap-4">
          <ModuleHero
            title="Mood"
            tone="mood"
            :icon="ICONS.mood"
            :eyebrow="fitness.isToday ? 'Your check-ins today' : `Your check-ins, ${formatLongDate(fitness.selectedDate)}`"
            :headline="todayMood == null ? 'Not logged' : MOOD_LABELS[Math.round(todayMood) - 1]"
            :headline-unit="entries.length ? `${entries.length} check-in${entries.length > 1 ? 's' : ''}` : undefined"
            :headline-ratio="todayMood == null ? null : todayMood / 5"
            :spark="lastValues(rangeDaysList, (d) => moodByDay.get(d.date) ?? null)"
            spark-label="Daily average mood over the last 7 days"
            :sentence="sentence"
            :stats="[
              { label: 'Energy', icon: ICONS.energy, value: avgText(mean(entries.map((e) => e.energy))), ratio: ratio5(mean(entries.map((e) => e.energy))) },
              { label: 'Stress you felt', icon: ICONS.stress, value: avgText(mean(entries.map((e) => e.stress))), ratio: ratio5(mean(entries.map((e) => e.stress))) },
              { label: `${fitness.rangeDays}-day mood`, icon: ICONS.mood, value: avgText(mean([...moodByDay.values()])), ratio: ratio5(mean([...moodByDay.values()])) },
              { label: 'Days checked in', icon: ICONS.cycle, value: `${moodByDay.size} of ${fitness.rangeDays}`, ratio: moodByDay.size / fitness.rangeDays },
            ]"
          >
            <template #actions>
              <PrimaryButton v-if="fitness.isToday" label="Log mood" @click="ui.openQuickLog('mood')" />
            </template>
          </ModuleHero>

          <div class="@container">
            <div class="grid items-start gap-4 @2xl:grid-cols-2 @[76rem]:grid-cols-3">
              <WidgetCard title="Check-ins" :icon="ICONS.mood" tone="mood" :label="fitness.isToday ? 'Today' : 'This day'" :value="String(entries.length)">
                <div class="overflow-y-auto" :style="editing || adding ? undefined : { height: `${AREA}px` }">
                  <ul v-if="entries.length" class="divide-y divide-line">
                    <li v-for="e in entries" :key="e.id" class="py-2.5 first:pt-0">
                      <MoodForm v-if="editing === e.id" :date="e.date" :existing="e" @done="editing = null" />
                      <div v-else class="flex items-start gap-3 text-sm">
                        <ChoiceGlyph kind="face" :level="e.mood" color="" class="size-8 shrink-0" still />
                        <div class="min-w-0 flex-1">
                          <p>
                            <span class="font-medium">{{ MOOD_LABELS[e.mood - 1] }}</span>
                            <span class="tabular text-xs text-muted"> · {{ formatClock(e.recordedAt) }}</span>
                          </p>
                          <p class="truncate text-xs text-ink-2">
                            <template v-if="e.energy">Energy {{ e.energy }}/5</template><template v-if="e.stress"> · stress {{ e.stress }}/5</template
                            ><template v-if="e.emotions.length"> · {{ e.emotions.join(', ') }}</template>
                          </p>
                        </div>
                        <button type="button" class="text-xs font-medium text-accent underline underline-offset-2" @click="editing = e.id">Edit</button>
                      </div>
                    </li>
                  </ul>
                  <p v-else class="text-sm text-muted">No check-in on this day.</p>
                  <div v-if="adding" class="mt-3 border-t border-line pt-3"><MoodForm :date="fitness.selectedDate" @done="adding = false" /></div>
                  <button v-else-if="!fitness.isToday" type="button" class="mt-3 text-sm font-medium text-accent underline underline-offset-2" @click="adding = true">Add a check-in for this day</button>
                </div>
              </WidgetCard>

              <WidgetCard title="Mood" :icon="ICONS.mood" tone="mood" label="Average" :value="avgText(mean([...moodByDay.values()]))">
                <LineChart v-bind="lineProps(moodByDay)" color="var(--mood-ink)" description="Daily average mood, 1 to 5" :height="CHART">
                  <template #legend><span class="flex items-center gap-1.5"><span class="h-0.5 w-3.5 rounded-full bg-[var(--mood-ink)]" aria-hidden="true" />Daily average, 1 very low – 5 great</span></template>
                </LineChart>
              </WidgetCard>

              <WidgetCard title="Energy" :icon="ICONS.energy" tone="energy" label="Average" :value="avgText(mean([...energyByDay.values()]))">
                <LineChart v-bind="lineProps(energyByDay)" color="var(--energy)" description="Daily average energy, 1 to 5" :height="CHART">
                  <template #legend><span class="flex items-center gap-1.5"><span class="h-0.5 w-3.5 rounded-full bg-[var(--energy)]" aria-hidden="true" />Daily average, 1 drained – 5 high</span></template>
                </LineChart>
              </WidgetCard>

              <WidgetCard title="Mood mix" :icon="ICONS.mood" tone="mood" label="Check-ins" :value="String(rangeEntries.length)" :note="`last ${fitness.rangeDays} days`">
                <DonutChart
                  v-if="rangeEntries.length"
                  :height="AREA"
                  :parts="moodMix"
                  :center-value="String(rangeEntries.length)"
                  center-label="check-ins"
                  :description="`Check-ins by mood: ${moodMix.map((p) => `${p.label} ${p.valueText}`).join(', ')}`"
                />
                <p v-else class="text-sm text-muted">No check-ins in this period.</p>
              </WidgetCard>

              <WidgetCard title="Most logged emotions" :icon="ICONS.mood" tone="mood" label="Top" :value="emotionCounts[0]?.[0] ?? EMPTY">
                <BarList v-if="emotionCounts.length" :height="AREA" :rows="emotionCounts.map(([name, n]) => ({ label: name, value: n, valueText: `${n}×` }))" color="var(--mood-ink)" :description="`Most logged emotions in the last ${fitness.rangeDays} days`" />
                <p v-else class="text-sm text-muted">No emotions logged in this period.</p>
              </WidgetCard>

              <WidgetCard title="Days checked in" :icon="ICONS.cycle" tone="mood" label="Logged on" :value="`${moodByDay.size} of ${fitness.rangeDays}`" note="days">
                <GoalDots :height="AREA" :days="checkInDots" color="var(--mood-ink)" what="Mood check-ins" met-label="Checked in" missed-label="No check-in" />
              </WidgetCard>
            </div>
          </div>
        </div>
      </JournalState>
    </TrackerGate>
  </AppShell>
</template>

<script setup lang="ts">
import { ICONS } from '@/components/metricIcons'
import { computed, ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import BarList from '@/components/charts/BarList.vue'
import DonutChart from '@/components/charts/DonutChart.vue'
import GoalDots from '@/components/charts/GoalDots.vue'
import LineChart from '@/components/charts/LineChart.vue'
import DateToolbar from '@/components/DateToolbar.vue'
import ChoiceGlyph from '@/components/forms/ChoiceGlyph.vue'
import { MOOD_CHOICES } from '@/components/forms/choices'
import MoodForm from '@/components/forms/MoodForm.vue'
import JournalState from '@/components/JournalState.vue'
import ModuleHero from '@/components/ModuleHero.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import TrackerGate from '@/components/TrackerGate.vue'
import WidgetCard from '@/components/WidgetCard.vue'
import { useJournalData } from '@/composables/useJournalData'
import { dailyTicks, lastValues } from '@/data/chartData'
import { mean } from '@/data/derive'
import { MOOD_LABELS, dailyMoodMean, topCounts } from '@/data/journalDerive'
import { EMPTY, formatClock, formatLongDate, formatShortDate, formatWeekday } from '@/lib/format'
import { useUiStore } from '@/stores/ui'
import type { ISODate } from '@/types/fitness'
import type { EntryId } from '@/types/journal'

const CHART = 130
const AREA = CHART + 28

const { fitness, journal, rangeDaysList } = useJournalData()
const ui = useUiStore()
const editing = ref<EntryId | null>(null)
const adding = ref(false)

const entries = computed(() => journal.onDate(fitness.selectedDate).mood)
const todayMood = computed(() => mean(entries.value.map((e) => e.mood)))
const rangeEntries = computed(() => {
  const first = rangeDaysList.value[0]?.date ?? fitness.selectedDate
  return journal.data.mood.filter((e) => e.date >= first && e.date <= fitness.selectedDate)
})
const moodByDay = computed(() => dailyMoodMean(rangeEntries.value, (e) => e.mood))
const energyByDay = computed(() => dailyMoodMean(rangeEntries.value, (e) => e.energy))
const emotionCounts = computed(() => topCounts(rangeEntries.value.flatMap((e) => e.emotions), 5))

const avgText = (v: number | null) => (v == null ? EMPTY : `${v.toFixed(1)} / 5`)
const ratio5 = (v: number | null) => (v == null ? null : v / 5)
const sentence = computed(() => {
  if (!entries.value.length) return fitness.isToday ? 'No check-in yet today. A few seconds is enough.' : 'No check-in on this day.'
  const emotions = [...new Set(entries.value.flatMap((e) => e.emotions))]
  return emotions.length ? `You felt ${emotions.slice(0, 3).join(', ')}.` : 'No emotions picked in these check-ins.'
})

const moodMix = computed(() =>
  MOOD_CHOICES.map((c) => {
    const n = rangeEntries.value.filter((e) => e.mood === c.value).length
    return { label: c.label, value: n, valueText: String(n), color: c.color }
  }).reverse(),
)

const checkInDots = computed(() =>
  rangeDaysList.value.map((d) => ({
    key: d.date,
    label: String(Number(d.date.slice(8))),
    title: `${formatWeekday(d.date)}, ${formatShortDate(d.date)}: ${moodByDay.value.has(d.date) ? 'checked in' : 'no check-in'}`,
    state: moodByDay.value.has(d.date) ? ('met' as const) : ('missed' as const),
  })),
)

function lineProps(byDay: Map<ISODate, number>) {
  const days = rangeDaysList.value
  return {
    points: days.map((d, i) => ({ x: i, label: `${formatWeekday(d.date)}, ${formatShortDate(d.date)}`, value: byDay.has(d.date) ? Math.round(byDay.get(d.date)! * 10) / 10 : null })),
    xDomain: [0, Math.max(1, days.length - 1)] as [number, number],
    xTicks: dailyTicks(days).filter((_, i, all) => i === 0 || i === all.length - 1 || i === Math.floor(all.length / 2)),
    markX: days.length - 1,
    unit: '/ 5',
    xName: 'Date',
    maxGap: 1,
    yDomain: [1, 5] as [number, number],
  }
}
</script>
