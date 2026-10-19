<template>
  <AppShell :title="fitness.isToday ? 'Today' : formatLongDate(fitness.selectedDate)">
    <template #subtitle>{{ fitness.isToday ? `${formatLongDate(fitness.today)} · ` : '' }}{{ freshness }}</template>
    <DataState>
      <WatchStatus />
      <DateToolbar />
      <div class="stagger grid gap-4">
        <TodayNudge v-if="fitness.isToday" :day="day" />
        <!-- Today the hero shows goal progress; other days get the tiles. -->
        <section v-else aria-labelledby="goals-title">
          <div class="mb-3 flex items-baseline justify-between gap-4">
            <h2 id="goals-title" class="text-base font-semibold tracking-tight">Goals</h2>
            <RouterLink to="/settings" class="text-xs text-muted underline-offset-2 hover:text-ink hover:underline">Edit goals</RouterLink>
          </div>
          <div class="grid gap-3 sm:grid-cols-3">
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
          </div>
        </section>

        <!-- Dashboard: a journal column beside the watch widgets, then the body signals. -->
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div class="md:row-span-2"><JournalState><TodayEntries class="h-full" /></JournalState></div>

          <WidgetCard
            class="md:col-span-1 lg:col-span-2"
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
              :height="170"
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
              :height="150"
              :table="false"
              :format-tick="(h: number) => `${h}h`"
              value-name="Sleep"
              description="Sleep per night by stage. Use arrow keys to inspect nights and Enter to select one."
              @select="fitness.selectDate"
            />
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
              :height="150"
              :table="false"
              color="var(--heart)"
              unit="bpm"
              x-name="Date"
              description="Resting heart rate by day"
            />
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
              :height="120"
              :table="false"
              :format-tick="(n: number) => String(n)"
              value-name="Average stress"
              description="Average watch stress per day. Use arrow keys to inspect days and Enter to select one."
              @select="fitness.selectDate"
            />
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
              :height="120"
              :table="false"
              color="var(--spo2)"
              unit="%"
              x-name="Date"
              description="Average overnight blood oxygen by day"
            />
          </WidgetCard>
          <WidgetCard
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
              :height="120"
              :table="false"
              color="var(--ink-2)"
              unit="°C"
              x-name="Date"
              description="Overnight skin temperature versus your baseline by day"
            />
          </WidgetCard>
          <div class="md:col-span-2 lg:col-span-3"><JournalState><WellbeingOverview /></JournalState></div>
        </div>
      </div>
    </DataState>
  </AppShell>
</template>

<script setup lang="ts">
import { ICONS } from '@/components/metricIcons'
import { computed, onMounted } from 'vue'
import AppShell from '@/components/AppShell.vue'
import BarChart from '@/components/charts/BarChart.vue'
import LineChart from '@/components/charts/LineChart.vue'
import DataState from '@/components/DataState.vue'
import DateToolbar from '@/components/DateToolbar.vue'
import GoalMeter from '@/components/GoalMeter.vue'
import WatchStatus from '@/components/WatchStatus.vue'
import WellbeingOverview from '@/components/WellbeingOverview.vue'
import TodayEntries from '@/components/TodayEntries.vue'
import TodayNudge from '@/components/TodayNudge.vue'
import JournalState from '@/components/JournalState.vue'
import WidgetCard from '@/components/WidgetCard.vue'
import { useJournalStore } from '@/stores/journal'
import { useFitnessData } from '@/composables/useFitnessData'
import { dailyLine, dailyTicks, metricBars, sleepBars } from '@/data/chartData'
import { progress, trend } from '@/data/derive'
import { formatDeviation } from '@/data/signals'
import { EMPTY, formatClock, formatDuration, formatInt, formatLongDate, formatPercentChange } from '@/lib/format'

const { fitness, freshness, goals, days, rangeDaysList, selectedDay: day } = useFitnessData()
const journal = useJournalStore()
onMounted(() => journal.ensureLoaded())

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
