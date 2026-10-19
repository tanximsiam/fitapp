<template>
  <AppShell title="Sleep">
    <template #subtitle>Night ending {{ formatLongDate(fitness.selectedDate) }} · {{ freshness }}</template>
    <DateToolbar />

    <DataState>
      <div class="grid gap-4">
        <ModuleHero
          title="Sleep"
          tone="sleep"
          :icon="ICONS.sleep"
          :eyebrow="`Night ending ${formatLongDate(fitness.selectedDate)}`"
          :headline="formatDuration(asleepMin ?? s?.durationMin)"
          :headline-unit="asleepMin != null ? 'asleep' : 'in bed'"
          :headline-ratio="progress(s?.durationMin, goals.sleepMin)"
          :spark="lastValues(rangeDaysList, (d) => d.sleep?.durationMin)"
          spark-label="Time in bed over the last 7 nights"
          :sentence="sentence"
          :stats="[
            { label: 'In bed', icon: ICONS.bedtime, value: formatDuration(s?.durationMin), ratio: progress(s?.durationMin, goals.sleepMin), note: `Goal ${formatDuration(goals.sleepMin)}` },
            { label: 'Deep', icon: ICONS.sleep, value: formatDuration(s?.stages?.deepMin), ratio: share(s?.stages?.deepMin), note: shareText(s?.stages?.deepMin) },
            { label: 'REM', icon: ICONS.sleep, value: formatDuration(s?.stages?.remMin), ratio: share(s?.stages?.remMin), note: shareText(s?.stages?.remMin) },
            { label: 'Sleep score', icon: ICONS.combined, value: formatInt(s?.score), ratio: s?.score == null ? null : s.score / 100, note: 'reported by device' },
          ]"
        />

        <div class="@container">
          <div class="grid items-start gap-4 @2xl:grid-cols-2 @[76rem]:grid-cols-3">
            <WidgetCard title="Stages this night" :icon="ICONS.sleep" tone="sleep" label="Bedtime – wake" :value="s ? `${formatClock(s.startAt)}–${formatClock(s.endAt)}` : EMPTY">
              <template v-if="s?.stages">
                <DonutChart
                  :parts="stageParts"
                  :height="AREA - 28"
                  :center-value="formatDuration(asleepMin)"
                  center-label="asleep"
                  :description="`Sleep stages this night: ${stageParts.map((p) => `${p.label} ${p.valueText}`).join(', ')}`"
                />
                <p class="mt-3 text-xs text-muted">{{ formatDuration(s.durationMin) }} in bed, {{ formatDuration(s.stages.awakeMin) }} of it awake.</p>
              </template>
              <p v-else class="text-sm text-muted">{{ s ? 'The source did not report sleep stages for this night.' : 'No sleep was recorded for this night.' }}</p>
            </WidgetCard>

            <WidgetCard title="Nightly sleep" :icon="ICONS.bedtime" tone="sleep" label="Average in bed" :value="formatDuration(avg((d) => d.sleep?.durationMin))">
              <BarChart
                :bars="sleepBars(rangeDaysList)"
                :selected-key="fitness.selectedDate"
                :goal="goals.sleepMin / 60"
                :goal-label="`Goal ${formatDuration(goals.sleepMin)}`"
                :format-tick="(h: number) => `${h}h`"
                :height="CHART"
                value-name="Sleep"
                description="Sleep per night by stage. Use arrow keys to inspect nights and Enter to select one."
                @select="fitness.selectDate"
              />
            </WidgetCard>

            <WidgetCard title="Bedtime" :icon="ICONS.bedtime" tone="sleep" label="Typical" :value="bedtimeAvg" :note="bedtimeSpread">
              <LineChart
                :points="dailyLine(rangeDaysList, (d) => (d.sleep ? sinceNoon(d.sleep.startAt) : null))"
                :x-domain="[0, Math.max(1, rangeDaysList.length - 1)]"
                :x-ticks="edgeTicks"
                :mark-x="rangeDaysList.length - 1"
                :format-y="clockFromNoon"
                :height="CHART"
                color="var(--sleep)"
                unit="minutes after noon"
                x-name="Night ending"
                description="Bedtime each night"
              >
                <template #legend><span class="flex items-center gap-1.5"><span class="h-0.5 w-3.5 rounded-full bg-sleep" aria-hidden="true" />Time you went to bed</span></template>
              </LineChart>
            </WidgetCard>

            <WidgetCard title="Deep sleep" :icon="ICONS.sleep" tone="sleep" label="Average" :value="formatDuration(avg((d) => d.sleep?.stages?.deepMin))">
              <BarChart
                :bars="metricBars(rangeDaysList, (d) => d.sleep?.stages?.deepMin, 'var(--stage-deep)', (n) => formatDuration(n))"
                :selected-key="fitness.selectedDate"
                :format-tick="(n: number) => `${Math.round(n)}m`"
                :height="CHART"
                value-name="Deep sleep"
                description="Deep sleep per night. Use arrow keys to inspect nights and Enter to select one."
                @select="fitness.selectDate"
              >
                <template #legend><span class="flex items-center gap-1.5"><span class="size-2 rounded-sm bg-[var(--stage-deep)]" aria-hidden="true" />Minutes in deep sleep</span></template>
              </BarChart>
            </WidgetCard>

            <WidgetCard title="Sleep score" :icon="ICONS.combined" tone="sleep" label="Average" :value="formatInt(avg((d) => d.sleep?.score))" note="reported by device">
              <LineChart
                :points="dailyLine(rangeDaysList, (d) => d.sleep?.score)"
                :x-domain="[0, Math.max(1, rangeDaysList.length - 1)]"
                :x-ticks="edgeTicks"
                :mark-x="rangeDaysList.length - 1"
                :y-domain="[40, 100]"
                :height="CHART"
                color="var(--stage-rem)"
                unit="score"
                x-name="Night ending"
                description="Sleep score per night, as reported by the device"
              >
                <template #legend><span class="flex items-center gap-1.5"><span class="h-0.5 w-3.5 rounded-full bg-[var(--stage-rem)]" aria-hidden="true" />Score out of 100</span></template>
              </LineChart>
            </WidgetCard>

            <WidgetCard title="Sleep goal nights" :icon="ICONS.bedtime" tone="sleep" label="Met on" :value="`${goalNights} of ${countMeasured(rangeDaysList, (d) => d.sleep?.durationMin)}`" note="measured nights">
              <GoalDots :height="AREA" :days="goalDots" color="var(--sleep)" what="Sleep goal" />
            </WidgetCard>
          </div>
        </div>
      </div>
    </DataState>
  </AppShell>
</template>

<script setup lang="ts">
import { ICONS } from '@/components/metricIcons'
import { computed } from 'vue'
import AppShell from '@/components/AppShell.vue'
import BarChart from '@/components/charts/BarChart.vue'
import GoalDots from '@/components/charts/GoalDots.vue'
import LineChart from '@/components/charts/LineChart.vue'
import DataState from '@/components/DataState.vue'
import DateToolbar from '@/components/DateToolbar.vue'
import ModuleHero from '@/components/ModuleHero.vue'
import DonutChart from '@/components/charts/DonutChart.vue'
import { SLEEP_STAGES } from '@/components/sleepStages'
import WidgetCard from '@/components/WidgetCard.vue'
import { useFitnessData } from '@/composables/useFitnessData'
import { dailyLine, dailyTicks, lastValues, metricBars, sleepBars } from '@/data/chartData'
import { countMeasured, mean, progress } from '@/data/derive'
import { wallMinutes } from '@/lib/dates'
import { EMPTY, formatClock, formatDuration, formatInt, formatLongDate, formatShortDate, formatWeekday } from '@/lib/format'
import type { DaySummary } from '@/types/fitness'

const CHART = 130
/** Content height of a chart widget (chart plus its legend row); list widgets fill the same height. */
const AREA = CHART + 28

const { fitness, freshness, goals, rangeDaysList, selectedDay: day } = useFitnessData()
const s = computed(() => day.value?.sleep ?? null)

const stageParts = computed(() =>
  [...SLEEP_STAGES].reverse().map((st) => {
    const min = s.value?.stages?.[st.key] ?? 0
    return { label: st.label, value: min, valueText: formatDuration(min), color: st.color }
  }),
)
const asleepMin = computed(() => (s.value && s.value.stages?.awakeMin != null ? s.value.durationMin - s.value.stages.awakeMin : null))
const avg = (pick: (d: DaySummary) => number | null | undefined) => mean(rangeDaysList.value.map(pick))
const share = (min: number | null | undefined) => (min == null || !s.value ? null : min / s.value.durationMin)
const shareText = (min: number | null | undefined) => (min == null || !s.value ? undefined : `${Math.round((min / s.value.durationMin) * 100)}% of the night`)
const edgeTicks = computed(() => dailyTicks(rangeDaysList.value).filter((_, i, all) => i === 0 || i === all.length - 1 || i === Math.floor(all.length / 2)))

const sentence = computed(() => {
  if (!s.value) return 'No sleep was recorded for this night.'
  const short = goals.value.sleepMin - s.value.durationMin
  const window = `In bed ${formatClock(s.value.startAt)}–${formatClock(s.value.endAt)}`
  return short <= 0 ? `${window}; your ${formatDuration(goals.value.sleepMin)} goal was reached.` : `${window}; ${formatDuration(short)} short of your ${formatDuration(goals.value.sleepMin)} goal.`
})

/** Bedtimes as minutes after noon, so 23:30 and 00:30 sit next to each other on the axis. */
const sinceNoon = (iso: string) => (wallMinutes(iso) + 720) % 1440
const clockFromNoon = (n: number) => {
  const m = (Math.round(n) + 720) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}
const bedtimes = computed(() => rangeDaysList.value.flatMap((d) => (d.sleep ? [sinceNoon(d.sleep.startAt)] : [])))
const bedtimeAvg = computed(() => (bedtimes.value.length ? clockFromNoon(mean(bedtimes.value)!) : EMPTY))
const bedtimeSpread = computed(() =>
  bedtimes.value.length > 1 ? `${clockFromNoon(Math.min(...bedtimes.value))}–${clockFromNoon(Math.max(...bedtimes.value))} range` : undefined,
)

const goalNights = computed(() => rangeDaysList.value.filter((d) => (d.sleep?.durationMin ?? -1) >= goals.value.sleepMin).length)
const goalDots = computed(() =>
  rangeDaysList.value.map((d) => {
    const m = d.sleep?.durationMin
    return {
      key: d.date,
      label: String(Number(d.date.slice(8))),
      title: `Night ending ${formatWeekday(d.date)}, ${formatShortDate(d.date)}: ${m == null ? 'not recorded' : formatDuration(m)}`,
      state: m == null ? ('none' as const) : m >= goals.value.sleepMin ? ('met' as const) : ('missed' as const),
    }
  }),
)
</script>
