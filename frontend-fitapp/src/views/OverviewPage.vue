<template>
  <AppShell :title="fitness.isToday ? 'Today' : formatLongDate(fitness.selectedDate)">
    <template #subtitle>{{ fitness.isToday ? `${formatLongDate(fitness.today)} · ` : '' }}{{ freshness }}</template>
    <DataState>
      <WatchStatus />
      <DateToolbar />
      <div class="stagger grid gap-5">
        <JournalState v-if="fitness.isToday"><TodayNudge :day="day" /></JournalState>
        <section aria-labelledby="goals-title">
          <div class="mb-3 flex items-baseline justify-between gap-4">
            <h2 id="goals-title" class="text-base font-semibold tracking-tight">{{ fitness.isToday ? 'Goals so far today' : 'Goals' }}</h2>
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

        <JournalState>
          <WellbeingOverview />
        </JournalState>

        <PanelSection :title="`Steps, last ${fitness.rangeDays} days`">
          <template #aside>
            <p class="text-xs text-muted">
              7-day average {{ formatInt(stepsTrend.current) }} · {{ formatPercentChange(stepsTrend.changePct) }} vs the previous 7
            </p>
          </template>
          <BarChart
            :bars="metricBars(rangeDaysList, (d) => d.activity?.steps, 'var(--activity)', formatInt)"
            :selected-key="fitness.selectedDate"
            :goal="goals.steps"
            :goal-label="`Goal ${formatInt(goals.steps)}`"
            value-name="Steps"
            description="Daily steps. Use arrow keys to inspect days and Enter to select one."
            @select="fitness.selectDate"
          />
        </PanelSection>

        <div class="grid gap-4 md:grid-cols-2">
          <PanelSection :title="fitness.isToday ? 'Last night' : 'Sleep that night'" tone="sleep">
            <template #aside>
              <RouterLink to="/sleep" class="text-xs text-muted underline-offset-2 hover:text-ink hover:underline">Sleep details</RouterLink>
            </template>
            <template v-if="day?.sleep">
              <dl class="mb-4 grid grid-cols-3 gap-4">
                <MetricItem label="Duration" :icon="ICONS.sleep" :value="formatDuration(day.sleep.durationMin)" />
                <MetricItem label="Bed – wake" :icon="ICONS.bedtime" :value="`${formatClock(day.sleep.startAt)}–${formatClock(day.sleep.endAt)}`" />
                <MetricItem label="Score" :value="formatInt(day.sleep.score)" note="device" />
              </dl>
              <SleepStages :stages="day.sleep.stages" />
            </template>
            <p v-else class="text-sm text-muted">No sleep was recorded for this night.</p>
          </PanelSection>

          <PanelSection title="Resting heart rate">
            <template #aside>
              <RouterLink to="/heart-rate" class="text-xs text-muted underline-offset-2 hover:text-ink hover:underline">Heart rate details</RouterLink>
            </template>
            <dl class="mb-3 grid grid-cols-3 gap-4">
              <MetricItem label="This day" :icon="ICONS.heartRate" :value="day?.heartRate?.restingBpm == null ? EMPTY : `${day.heartRate.restingBpm} bpm`" />
              <MetricItem label="7-day average" :value="restingTrend.current == null ? EMPTY : `${Math.round(restingTrend.current)} bpm`" />
              <MetricItem label="Range" :value="rangeText" />
            </dl>
            <LineChart
              :points="dailyLine(rangeDaysList, (d) => d.heartRate?.restingBpm)"
              :x-domain="[0, Math.max(1, rangeDaysList.length - 1)]"
              :x-ticks="dailyTicks(rangeDaysList)"
              :mark-x="rangeDaysList.length - 1"
              :height="150"
              :table="false"
              color="var(--heart)"
              unit="bpm"
              x-name="Date"
              description="Resting heart rate by day"
            />
          </PanelSection>
        </div>
        <BodySignals />
        <JournalState><TodayEntries /></JournalState>
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
import BodySignals from '@/components/BodySignals.vue'
import JournalState from '@/components/JournalState.vue'
import { useJournalStore } from '@/stores/journal'
import MetricItem from '@/components/MetricItem.vue'
import PanelSection from '@/components/PanelSection.vue'
import SleepStages from '@/components/SleepStages.vue'
import { useFitnessData } from '@/composables/useFitnessData'
import { dailyLine, dailyTicks, metricBars } from '@/data/chartData'
import { progress, trend } from '@/data/derive'
import { EMPTY, formatClock, formatDuration, formatInt, formatLongDate, formatPercentChange } from '@/lib/format'

const { fitness, freshness, goals, days, rangeDaysList, selectedDay: day } = useFitnessData()
const journal = useJournalStore()
onMounted(() => journal.ensureLoaded())

// A partly finished today would drag averages down, so trends use complete days.
const completeDays = computed(() => (fitness.isToday ? days.value.slice(0, -1) : days.value))
const stepsTrend = computed(() => trend(completeDays.value, (d) => d.activity?.steps))
const restingTrend = computed(() => trend(completeDays.value, (d) => d.heartRate?.restingBpm))
const rangeText = computed(() => {
  const vals = rangeDaysList.value.map((d) => d.heartRate?.restingBpm).filter((v): v is number => v != null)
  return vals.length ? `${Math.min(...vals)}–${Math.max(...vals)} bpm` : EMPTY
})
</script>
