<template>
  <AppShell :title="fitness.isToday ? 'Today' : formatLongDate(fitness.selectedDate)">
    <template #subtitle>{{ fitness.isToday ? `${formatLongDate(fitness.today)} · ` : '' }}{{ freshness }}</template>
    <DataState>
      <WatchStatus />
      <DateToolbar />
      <div class="grid gap-4">
        <PanelSection :title="fitness.isToday ? 'Goals so far today' : 'Goals'">
          <template #aside>
            <RouterLink to="/settings" class="text-xs text-muted underline-offset-2 hover:text-ink hover:underline">Edit goals</RouterLink>
          </template>
          <div class="grid gap-6 sm:grid-cols-3">
            <GoalMeter
              label="Steps"
              :value-text="formatInt(day?.activity?.steps)"
              :goal-text="formatInt(goals.steps)"
              :ratio="progress(day?.activity?.steps, goals.steps)"
              color="var(--activity)"
            />
            <GoalMeter
              label="Active energy"
              :value-text="day?.activity?.activeKcal == null ? EMPTY : `${formatInt(day.activity.activeKcal)} kcal`"
              :goal-text="`${formatInt(goals.activeKcal)} kcal`"
              :ratio="progress(day?.activity?.activeKcal, goals.activeKcal)"
              color="var(--activity)"
            />
            <GoalMeter
              label="Sleep"
              :value-text="formatDuration(day?.sleep?.durationMin)"
              :goal-text="formatDuration(goals.sleepMin)"
              :ratio="progress(day?.sleep?.durationMin, goals.sleepMin)"
              color="var(--sleep)"
            />
          </div>
        </PanelSection>

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
          <PanelSection :title="fitness.isToday ? 'Last night' : 'Sleep that night'">
            <template #aside>
              <RouterLink to="/sleep" class="text-xs text-muted underline-offset-2 hover:text-ink hover:underline">Sleep details</RouterLink>
            </template>
            <template v-if="day?.sleep">
              <dl class="mb-4 grid grid-cols-3 gap-4">
                <MetricItem label="Duration" :value="formatDuration(day.sleep.durationMin)" />
                <MetricItem label="Bed – wake" :value="`${formatClock(day.sleep.startAt)}–${formatClock(day.sleep.endAt)}`" />
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
              <MetricItem label="This day" :value="day?.heartRate?.restingBpm == null ? EMPTY : `${day.heartRate.restingBpm} bpm`" />
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
      </div>
    </DataState>
  </AppShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppShell from '@/components/AppShell.vue'
import BarChart from '@/components/charts/BarChart.vue'
import LineChart from '@/components/charts/LineChart.vue'
import DataState from '@/components/DataState.vue'
import DateToolbar from '@/components/DateToolbar.vue'
import GoalMeter from '@/components/GoalMeter.vue'
import WatchStatus from '@/components/WatchStatus.vue'
import MetricItem from '@/components/MetricItem.vue'
import PanelSection from '@/components/PanelSection.vue'
import SleepStages from '@/components/SleepStages.vue'
import { useFitnessData } from '@/composables/useFitnessData'
import { dailyLine, dailyTicks, metricBars } from '@/data/chartData'
import { progress, trend } from '@/data/derive'
import { EMPTY, formatClock, formatDuration, formatInt, formatLongDate, formatPercentChange } from '@/lib/format'

const { fitness, freshness, goals, days, rangeDaysList, selectedDay: day } = useFitnessData()

// A partly finished today would drag averages down, so trends use complete days.
const completeDays = computed(() => (fitness.isToday ? days.value.slice(0, -1) : days.value))
const stepsTrend = computed(() => trend(completeDays.value, (d) => d.activity?.steps))
const restingTrend = computed(() => trend(completeDays.value, (d) => d.heartRate?.restingBpm))
const rangeText = computed(() => {
  const vals = rangeDaysList.value.map((d) => d.heartRate?.restingBpm).filter((v): v is number => v != null)
  return vals.length ? `${Math.min(...vals)}–${Math.max(...vals)} bpm` : EMPTY
})
</script>
