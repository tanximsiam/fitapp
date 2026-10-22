<template>
  <AppShell :title="fitness.isToday ? 'Today' : formatLongDate(fitness.selectedDate)">
    <template #subtitle>{{ fitness.isToday ? `${formatLongDate(fitness.today)} · ` : '' }}{{ freshness }}</template>
    <DataState>
      <div class="stagger grid gap-4">
        <TodayNudge v-if="fitness.isToday" :day="day" />
        <!-- Today the hero shows goal progress; other days get the tiles. -->
        <section v-else aria-labelledby="goals-title">
          <div class="mb-3 flex items-baseline justify-between gap-4">
            <h2 id="goals-title" class="text-base font-semibold tracking-tight">Goals</h2>
          </div>
          <div class="grid gap-3" :class="journal.prefs.hydration ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-3'">
            <div class="tone tone-activity rounded-2xl p-5">
              <GoalMeter
                label="Steps"
                :icon="ICONS.steps"
                :value-text="formatInt(day?.activity?.steps)"
                :value="day?.activity?.steps"
                :format="(n: number) => formatInt(Math.round(n))"
                :goal-text="formatInt(goals.steps)"
                :ratio="progress(day?.activity?.steps, goals.steps)"
                color="var(--activity)"
              />
            </div>
            <div class="tone tone-energy rounded-2xl p-5">
              <GoalMeter
                label="Active energy"
                :icon="ICONS.activeEnergy"
                :value-text="day?.activity?.activeKcal == null ? EMPTY : `${formatInt(day.activity.activeKcal)} kcal`"
                :value="day?.activity?.activeKcal"
                :format="(n: number) => `${formatInt(Math.round(n))} kcal`"
                :goal-text="`${formatInt(goals.activeKcal)} kcal`"
                :ratio="progress(day?.activity?.activeKcal, goals.activeKcal)"
                color="var(--energy)"
              />
            </div>
            <div class="tone tone-sleep rounded-2xl p-5">
              <GoalMeter
                label="Sleep"
                :icon="ICONS.sleep"
                :value-text="formatDuration(day?.sleep?.durationMin)"
                :value="day?.sleep?.durationMin"
                :format="(n: number) => formatDuration(Math.round(n))"
                :goal-text="formatDuration(goals.sleepMin)"
                :ratio="progress(day?.sleep?.durationMin, goals.sleepMin)"
                color="var(--sleep)"
              />
            </div>
            <div v-if="journal.prefs.hydration" class="tone tone-activity rounded-2xl p-5">
              <GoalMeter
                label="Water"
                :icon="ICONS.water"
                :value-text="`${formatInt(waterMl)} ml`"
                :value="waterMl"
                :format="(n: number) => `${formatInt(Math.round(n))} ml`"
                :goal-text="`${formatInt(goals.waterMl)} ml`"
                :ratio="progress(waterMl, goals.waterMl)"
                color="var(--activity)"
              />
            </div>
          </div>
        </section>

        <!-- Dashboard: calendar and journal on the left, the watch widgets beside them. -->
        <div class="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
          <span v-if="fitness.loading && fitness.loaded" class="text-xs text-muted" role="status">Updating…</span>
          <span class="text-xs text-muted">Charts show</span>
          <RangeTabs :model-value="fitness.rangeDays" @update:model-value="fitness.setRange" />
        </div>
        <!-- Columns follow the space beside the sidebar (container queries), so widgets never drop below ~300px. -->
        <div class="@container">
        <!-- Cards keep their natural height; only the journal grows, to end level with its nearest neighbour (see alignJournal). -->
        <div ref="grid" class="grid items-start gap-4 @2xl:grid-cols-2 @4xl:grid-cols-3 @[84rem]:grid-cols-4">
          <div ref="leftColumn" class="flex flex-col gap-4 @2xl:row-span-3">
            <MonthCalendar :model-value="fitness.selectedDate" :today="fitness.today" :has-data="hasData" @update:model-value="fitness.selectDate" />
            <div ref="journalBox" class="flex flex-col"><JournalState><TodayEntries class="flex-1" /></JournalState></div>
          </div>

          <WidgetCard
            class="@4xl:col-span-2"
            title="Steps"
            :icon="ICONS.steps"
            tone="activity"
            to="/activity"
            label="7-day average"
            :value="formatInt(stepsTrend.current)"
            :note="`${formatPercentChange(stepsTrend.changePct)} vs the previous 7`"
          >
            <BarChart
              :bars="metricBars(rangeDaysList, (d) => d.activity?.steps, 'var(--activity)', formatInt)"
              :selected-key="fitness.selectedDate"
              :goal="goals.steps"
              :goal-label="`Goal ${formatInt(goals.steps)}`"
              :height="130"
              :table="false"
              value-name="Steps"
              description="Daily steps. Use arrow keys to inspect days and Enter to select one."
              @select="fitness.selectDate"
            />
          </WidgetCard>

          <WidgetCard
            title="Sleep"
            :icon="ICONS.sleep"
            tone="sleep"
            to="/sleep"
            :label="fitness.isToday ? 'Last night' : 'That night'"
            :value="formatDuration(day?.sleep?.durationMin)"
            :note="day?.sleep ? `${formatClock(day.sleep.startAt)}–${formatClock(day.sleep.endAt)}` : undefined"
          >
            <BarChart
              :bars="sleepBars(rangeDaysList)"
              :selected-key="fitness.selectedDate"
              :height="130"
              :table="false"
              :format-tick="(h: number) => `${h}h`"
              value-name="Sleep"
              description="Sleep per night by stage. Use arrow keys to inspect nights and Enter to select one."
              @select="fitness.selectDate"
            >
              <template #legend>
                <span v-for="s in [...SLEEP_STAGES].reverse()" :key="s.key" class="flex items-center gap-1.5">
                  <span class="size-2 rounded-sm" :style="{ background: s.color }" aria-hidden="true" />{{ s.label }}
                </span>
              </template>
            </BarChart>
          </WidgetCard>

          <WidgetCard
            title="Resting heart rate"
            :icon="ICONS.heartRate"
            tone="heart"
            to="/heart-rate"
            label="This day"
            :value="day?.heartRate?.restingBpm == null ? EMPTY : `${day.heartRate.restingBpm} bpm`"
            :note="restingTrend.current == null ? undefined : `7-day average ${Math.round(restingTrend.current)} bpm`"
          >
            <LineChart
              :points="dailyLine(rangeDaysList, (d) => d.heartRate?.restingBpm)"
              :x-domain="[0, Math.max(1, rangeDaysList.length - 1)]"
              :x-ticks="dailyTicks(rangeDaysList).filter((_, i, a) => i === 0 || i === a.length - 1 || i === Math.floor(a.length / 2))"
              :mark-x="rangeDaysList.length - 1"
              :height="130"
              :table="false"
              color="var(--heart)"
              unit="bpm"
              x-name="Date"
              description="Resting heart rate by day"
            >
              <template #legend>
                <span class="flex items-center gap-1.5"><span class="h-0.5 w-3.5 rounded-full" style="background: var(--heart)" aria-hidden="true" />Resting heart rate</span>
                <span class="flex items-center gap-1.5"><svg width="14" height="2" aria-hidden="true"><line x1="0" x2="14" y1="1" y2="1" stroke="var(--accent)" stroke-dasharray="3 2" /></svg>Selected day</span>
              </template>
            </LineChart>
          </WidgetCard>

          <WidgetCard
            title="Stress"
            :icon="ICONS.stress"
            tone="stress"
            to="/stress"
            label="Average"
            :value="day?.stress ? `${day.stress.avg} / 100` : EMPTY"
          >
            <BarChart
              :bars="metricBars(rangeDaysList, (d) => d.stress?.avg, 'var(--stress)', (n) => `${n} / 100`)"
              :selected-key="fitness.selectedDate"
              :height="130"
              :table="false"
              :format-tick="(n: number) => String(n)"
              value-name="Average stress"
              description="Average watch stress per day. Use arrow keys to inspect days and Enter to select one."
              @select="fitness.selectDate"
            >
              <template #legend>
                <span class="flex items-center gap-1.5"><span class="size-2 rounded-sm" style="background: var(--stress)" aria-hidden="true" />Daily average, 0–100</span>
              </template>
            </BarChart>
          </WidgetCard>
          <WidgetCard
            title="Blood oxygen"
            :icon="ICONS.spo2"
            tone="spo2"
            to="/blood-oxygen"
            label="Overnight"
            :value="day?.spo2 ? `${day.spo2.avg}%` : EMPTY"
            :note="day?.spo2 ? `lowest ${day.spo2.min}%` : undefined"
          >
            <LineChart
              :points="dailyLine(rangeDaysList, (d) => d.spo2?.avg)"
              :x-domain="[0, Math.max(1, rangeDaysList.length - 1)]"
              :x-ticks="dailyTicks(rangeDaysList).filter((_, i, a) => i === 0 || i === a.length - 1)"
              :y-domain="[86, 100]"
              :height="130"
              :table="false"
              color="var(--spo2)"
              unit="%"
              x-name="Date"
              description="Average overnight blood oxygen by day"
            >
              <template #legend>
                <span class="flex items-center gap-1.5"><span class="h-0.5 w-3.5 rounded-full" style="background: var(--spo2)" aria-hidden="true" />Overnight average</span>
              </template>
            </LineChart>
          </WidgetCard>
          <!-- At three columns skin temperature joins the graphs on the right and the wellbeing overview takes the bottom left. -->
          <WidgetCard
            class="@4xl:order-last @[84rem]:order-none"
            title="Skin temperature"
            :icon="ICONS.skinTemp"
            tone="skin"
            to="/skin-temperature"
            label="Overnight"
            :value="day?.skinTemp ? formatDeviation(day.skinTemp.deviationC) : EMPTY"
            :note="day?.skinTemp ? 'vs baseline' : undefined"
          >
            <LineChart
              :points="dailyLine(rangeDaysList, (d) => d.skinTemp?.deviationC)"
              :x-domain="[0, Math.max(1, rangeDaysList.length - 1)]"
              :x-ticks="dailyTicks(rangeDaysList).filter((_, i, a) => i === 0 || i === a.length - 1)"
              :y-domain="[-skinLimit, skinLimit]"
              :format-y="(n: number) => (n === 0 ? 'base' : `${n > 0 ? '+' : '−'}${Math.abs(n).toFixed(1)}`)"
              :height="130"
              :table="false"
              color="var(--ink-2)"
              unit="°C"
              x-name="Date"
              description="Overnight skin temperature versus your baseline by day"
            >
              <template #legend>
                <span class="flex items-center gap-1.5"><span class="h-0.5 w-3.5 rounded-full" style="background: var(--ink-2)" aria-hidden="true" />Nightly change from your baseline</span>
              </template>
            </LineChart>
          </WidgetCard>
          <div class="@2xl:col-span-2"><JournalState><WellbeingOverview /></JournalState></div>
        </div>
        </div>
      </div>
    </DataState>
  </AppShell>
</template>

<script setup lang="ts">
import { ICONS } from '@/components/metricIcons'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import BarChart from '@/components/charts/BarChart.vue'
import LineChart from '@/components/charts/LineChart.vue'
import DataState from '@/components/DataState.vue'
import MonthCalendar from '@/components/MonthCalendar.vue'
import RangeTabs from '@/components/RangeTabs.vue'
import GoalMeter from '@/components/GoalMeter.vue'
import WellbeingOverview from '@/components/WellbeingOverview.vue'
import TodayEntries from '@/components/TodayEntries.vue'
import TodayNudge from '@/components/TodayNudge.vue'
import JournalState from '@/components/JournalState.vue'
import WidgetCard from '@/components/WidgetCard.vue'
import { useJournalStore } from '@/stores/journal'
import { useFitnessData } from '@/composables/useFitnessData'
import { SLEEP_STAGES } from '@/components/sleepStages'
import { dailyLine, dailyTicks, metricBars, sleepBars } from '@/data/chartData'
import { progress, trend } from '@/data/derive'
import { formatDeviation } from '@/data/signals'
import { EMPTY, formatClock, formatDuration, formatInt, formatLongDate, formatPercentChange } from '@/lib/format'

const { fitness, freshness, goals, days, rangeDaysList, selectedDay: day, hasData } = useFitnessData()
const journal = useJournalStore()
const waterMl = computed(() => journal.onDate(fitness.selectedDate).hydration.reduce((n, h) => n + h.volumeMl, 0))
onMounted(() => journal.ensureLoaded())

/**
 * The journal ends level with the nearest card beside it: the lowest card in the adjacent column that starts
 * alongside the left column. Cards further away (like the wellbeing overview two columns over) never set it,
 * and the journal is never cut shorter than its content.
 */
const grid = ref<HTMLElement | null>(null)
const leftColumn = ref<HTMLElement | null>(null)
const journalBox = ref<HTMLElement | null>(null)
let frame = 0
function alignJournal() {
  const g = grid.value
  const left = leftColumn.value
  const box = journalBox.value
  if (!g || !left || !box) return
  box.style.minHeight = ''
  const l = left.getBoundingClientRect()
  if (!l.height) return // hidden Ionic page
  const gap = parseFloat(getComputedStyle(g).columnGap) || 0
  const beside = Array.from(g.children)
    .filter((c) => c !== left)
    .map((c) => c.getBoundingClientRect())
    .filter((r) => Math.abs(r.left - (l.right + gap)) < 2 && r.top < l.bottom)
  if (!beside.length) return
  const extra = Math.max(...beside.map((r) => r.bottom)) - l.bottom
  if (extra > 0) box.style.minHeight = `${box.getBoundingClientRect().height + extra}px`
}
const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(alignJournal)
})
onMounted(() => {
  if (grid.value) observer?.observe(grid.value)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  cancelAnimationFrame(frame)
})

// A partly finished today would drag averages down, so trends use complete days.
const completeDays = computed(() => (fitness.isToday ? days.value.slice(0, -1) : days.value))
const stepsTrend = computed(() => trend(completeDays.value, (d) => d.activity?.steps))
const restingTrend = computed(() => trend(completeDays.value, (d) => d.heartRate?.restingBpm))
/** Symmetric range around the baseline, at least ±1 °C, in 0.5 steps. */
const skinLimit = computed(() => {
  const vals = rangeDaysList.value.map((d) => d.skinTemp?.deviationC).filter((v): v is number => v != null)
  return Math.max(1, Math.ceil(Math.max(0, ...vals.map(Math.abs)) * 2) / 2)
})
</script>
