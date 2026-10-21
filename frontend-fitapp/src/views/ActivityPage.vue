<template>
  <AppShell title="Activity">
    <template #subtitle>{{ formatLongDate(fitness.selectedDate) }} · {{ freshness }}</template>
    <DateToolbar />

    <DataState>
      <div class="grid gap-4">
        <ModuleHero
          title="Activity"
          tone="activity"
          :icon="ICONS.activity"
          :eyebrow="fitness.isToday ? 'So far today' : formatLongDate(fitness.selectedDate)"
          :headline="formatInt(a?.steps)"
          headline-unit="steps"
          :headline-ratio="progress(a?.steps, goals.steps)"
          :spark="lastValues(rangeDaysList, (d) => d.activity?.steps)"
          spark-label="Steps over the last 7 days"
          :sentence="sentence"
          :stats="[
            { label: 'Distance', icon: ICONS.distance, value: formatKm(a?.distanceM), ratio: progress(a?.distanceM, goals.distanceM), note: `Goal ${formatKm(goals.distanceM)}` },
            { label: 'Active energy', icon: ICONS.activeEnergy, value: a?.activeKcal == null ? EMPTY : `${formatInt(a.activeKcal)} kcal`, ratio: progress(a?.activeKcal, goals.activeKcal), note: `Goal ${formatInt(goals.activeKcal)} kcal` },
            { label: 'Active time', icon: ICONS.activeTime, value: formatDuration(a?.activeMinutes) },
            { label: 'Workouts', icon: ICONS.workouts, value: String(day?.workouts.length ?? 0), note: `${rangeWorkouts} in ${fitness.rangeDays} days` },
          ]"
        />

        <div class="@container">
          <div class="grid items-start gap-4 @2xl:grid-cols-2 @[76rem]:grid-cols-3">
            <WidgetCard title="Steps" :icon="ICONS.steps" tone="activity" label="Daily average" :value="formatInt(avg((d) => d.activity?.steps))" :note="`goal met ${goalDays((d) => d.activity?.steps, goals.steps)} days`">
              <BarChart
                :bars="metricBars(rangeDaysList, (d) => d.activity?.steps, 'var(--activity)', formatInt)"
                :selected-key="fitness.selectedDate"
                :goal="goals.steps"
                :goal-label="`Goal ${formatInt(goals.steps)}`"
                :height="CHART"
                value-name="Steps"
                description="Daily steps. Use arrow keys to inspect days and Enter to select one."
                @select="fitness.selectDate"
              />
            </WidgetCard>

            <WidgetCard title="Distance" :icon="ICONS.distance" tone="activity" label="Total" :value="formatKm(total((d) => d.activity?.distanceM))" :note="`${formatKm(avg((d) => d.activity?.distanceM))} a day`">
              <LineChart
                :points="dailyLine(rangeDaysList, (d) => (d.activity?.distanceM == null ? null : Math.round(d.activity.distanceM / 100) / 10))"
                :x-domain="[0, Math.max(1, rangeDaysList.length - 1)]"
                :x-ticks="edgeTicks"
                :mark-x="rangeDaysList.length - 1"
                :height="CHART"
                :format-y="(n: number) => `${n}`"
                color="var(--activity)"
                unit="km"
                x-name="Date"
                description="Distance per day in kilometres"
              >
                <template #legend><span class="flex items-center gap-1.5"><span class="h-0.5 w-3.5 rounded-full bg-activity" aria-hidden="true" />Kilometres per day</span></template>
              </LineChart>
            </WidgetCard>

            <WidgetCard title="Active energy" :icon="ICONS.activeEnergy" tone="energy" label="Daily average" :value="avg((d) => d.activity?.activeKcal) == null ? EMPTY : `${formatInt(avg((d) => d.activity?.activeKcal))} kcal`" :note="`goal met ${goalDays((d) => d.activity?.activeKcal, goals.activeKcal)} days`">
              <BarChart
                :bars="metricBars(rangeDaysList, (d) => d.activity?.activeKcal, 'var(--energy)', (n) => `${formatInt(n)} kcal`)"
                :selected-key="fitness.selectedDate"
                :goal="goals.activeKcal"
                :goal-label="`Goal ${formatInt(goals.activeKcal)} kcal`"
                :height="CHART"
                value-name="Active energy"
                description="Active energy per day. Use arrow keys to inspect days and Enter to select one."
                @select="fitness.selectDate"
              />
            </WidgetCard>

            <WidgetCard title="Active time" :icon="ICONS.activeTime" tone="activity" label="Daily average" :value="formatDuration(avg((d) => d.activity?.activeMinutes))">
              <BarChart
                :bars="metricBars(rangeDaysList, (d) => d.activity?.activeMinutes, 'var(--stress)', (n) => formatDuration(n))"
                :selected-key="fitness.selectedDate"
                :height="CHART"
                :format-tick="(n: number) => `${Math.round(n)}m`"
                value-name="Active time"
                description="Active minutes per day. Use arrow keys to inspect days and Enter to select one."
                @select="fitness.selectDate"
              >
                <template #legend><span class="flex items-center gap-1.5"><span class="size-2 rounded-sm bg-[var(--stress)]" aria-hidden="true" />Minutes moving</span></template>
              </BarChart>
            </WidgetCard>

            <WidgetCard title="Step goal days" :icon="ICONS.steps" tone="activity" label="Met on" :value="`${goalDays((d) => d.activity?.steps, goals.steps)} of ${countMeasured(rangeDaysList, (d) => d.activity?.steps)}`" note="measured days">
              <GoalDots :height="AREA" :days="stepGoalDots" color="var(--activity)" what="Step goal" />
            </WidgetCard>

            <WidgetCard title="Logged in the app" :icon="ICONS.workouts" tone="heart" :label="fitness.isToday ? 'Today' : 'This day'" :value="String(logged.length)" :note="loggedKcal ? `${formatInt(loggedKcal)} kcal` : undefined">
              <ul v-if="logged.length" class="divide-y divide-line overflow-y-auto" :style="{ height: `${AREA}px` }">
                <li v-for="e in logged" :key="e.id" class="flex items-center gap-3 py-2 text-sm first:pt-0">
                  <ion-icon :icon="activityKind(e.activityType).icon" aria-hidden="true" class="shrink-0 text-base text-[var(--heart)]" />
                  <span class="min-w-0 flex-1 truncate font-medium">{{ activityKind(e.activityType).label }}</span>
                  <span class="tabular shrink-0 text-ink-2">
                    {{ formatClock(e.startedAt) }} · {{ formatDuration(e.durationMin) }}<template v-if="e.energyKcal != null"> · {{ formatInt(e.energyKcal) }} kcal{{ e.energySource === 'estimated' ? ' (est.)' : '' }}</template>
                  </span>
                </li>
              </ul>
              <p v-else class="text-sm text-muted" :style="{ height: `${AREA}px` }">No activities logged on this day. Chores, walks and workouts are logged in the FitApp mobile app.</p>
            </WidgetCard>

            <WidgetCard title="Workouts" :icon="ICONS.workouts" tone="heart" :label="fitness.isToday ? 'Today' : 'This day'" :value="String(day?.workouts.length ?? 0)" :note="`${rangeWorkouts} in the last ${fitness.rangeDays} days`">
              <!-- This day's workouts first, then the most recent ones in the period. -->
              <ul v-if="recentWorkouts.length" class="divide-y divide-line overflow-y-auto" :style="{ height: `${AREA}px` }">
                <li v-for="w in recentWorkouts" :key="w.startAt" class="flex items-center gap-3 py-2 text-sm first:pt-0">
                  <span class="tabular w-14 shrink-0 text-xs text-muted">{{ w.startAt.slice(0, 10) === fitness.selectedDate ? formatClock(w.startAt) : formatShortDate(w.startAt.slice(0, 10)) }}</span>
                  <span class="min-w-0 flex-1 truncate font-medium">{{ workoutLabel(w.type) }}</span>
                  <span class="tabular shrink-0 text-ink-2">
                    {{ formatDuration(w.durationMin) }}<template v-if="w.distanceM != null"> · {{ formatKm(w.distanceM) }}</template>
                  </span>
                </li>
              </ul>
              <p v-else class="text-sm text-muted" :style="{ height: `${AREA}px` }">No workouts were recorded in this period.</p>
            </WidgetCard>
          </div>
        </div>

        <PanelSection title="History">
          <div class="-mx-4 overflow-x-auto sm:mx-0">
            <table id="activity-history" class="w-full min-w-[34rem] text-left text-sm">
              <thead>
                <tr class="text-xs text-muted">
                  <th scope="col" class="px-4 py-2 font-medium sm:pl-0">Date</th>
                  <th scope="col" class="px-4 py-2 text-right font-medium">Steps</th>
                  <th scope="col" class="px-4 py-2 text-right font-medium">Distance</th>
                  <th scope="col" class="px-4 py-2 text-right font-medium">Active energy</th>
                  <th scope="col" class="px-4 py-2 text-right font-medium sm:pr-0">Active time</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in historyRows" :key="d.date" class="border-t border-line" :class="d.date === fitness.selectedDate ? 'bg-accent-soft/60' : ''">
                  <th scope="row" class="px-4 py-2 font-normal sm:pl-0">
                    <button type="button" class="text-left text-ink underline-offset-2 hover:underline" @click="fitness.selectDate(d.date)">
                      {{ formatWeekday(d.date) }}, {{ formatShortDate(d.date) }}
                    </button>
                  </th>
                  <td class="tabular px-4 py-2 text-right">{{ formatInt(d.activity?.steps) }}</td>
                  <td class="tabular px-4 py-2 text-right">{{ formatKm(d.activity?.distanceM) }}</td>
                  <td class="tabular px-4 py-2 text-right">{{ d.activity?.activeKcal == null ? EMPTY : `${formatInt(d.activity.activeKcal)} kcal` }}</td>
                  <td class="tabular px-4 py-2 text-right sm:pr-0">{{ formatDuration(d.activity?.activeMinutes) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ShowMore v-if="rangeDaysList.length > 7" v-model:expanded="showAllHistory" controls="activity-history" :more-label="`Show all ${rangeDaysList.length} days`" />
        </PanelSection>
      </div>
    </DataState>
  </AppShell>
</template>

<script setup lang="ts">
import { ICONS } from '@/components/metricIcons'
import { computed, ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import BarChart from '@/components/charts/BarChart.vue'
import GoalDots from '@/components/charts/GoalDots.vue'
import LineChart from '@/components/charts/LineChart.vue'
import DataState from '@/components/DataState.vue'
import DateToolbar from '@/components/DateToolbar.vue'
import ModuleHero from '@/components/ModuleHero.vue'
import PanelSection from '@/components/PanelSection.vue'
import ShowMore from '@/components/ShowMore.vue'
import WidgetCard from '@/components/WidgetCard.vue'
import { IonIcon } from '@ionic/vue'
import { useFitnessData } from '@/composables/useFitnessData'
import { activityKind } from '@/data/activities'
import { useJournalStore } from '@/stores/journal'
import { dailyLine, dailyTicks, lastValues, metricBars } from '@/data/chartData'
import { workoutLabel } from '@/data/connection'
import { countMeasured, mean, progress } from '@/data/derive'
import { EMPTY, formatClock, formatDuration, formatInt, formatKm, formatLongDate, formatShortDate, formatWeekday } from '@/lib/format'
import type { DaySummary } from '@/types/fitness'

/** One chart height for every widget, so cards in a row line up. */
const CHART = 130
/** Content height of a chart widget (chart plus its legend row); list widgets fill the same height. */
const AREA = CHART + 28

const { fitness, freshness, goals, rangeDaysList, selectedDay: day } = useFitnessData()
const a = computed(() => day.value?.activity ?? null)

const avg = (pick: (d: DaySummary) => number | null | undefined) => mean(rangeDaysList.value.map(pick))
const total = (pick: (d: DaySummary) => number | null | undefined) => {
  const v = rangeDaysList.value.map(pick).filter((x): x is number => x != null)
  return v.length ? v.reduce((s, x) => s + x, 0) : null
}
const goalDays = (pick: (d: DaySummary) => number | null | undefined, goal: number) => rangeDaysList.value.filter((d) => (pick(d) ?? -1) >= goal).length
const edgeTicks = computed(() => dailyTicks(rangeDaysList.value).filter((_, i, all) => i === 0 || i === all.length - 1 || i === Math.floor(all.length / 2)))

const sentence = computed(() => {
  const steps = a.value?.steps
  if (steps == null) return 'No activity was recorded on this day.'
  if (steps >= goals.value.steps) return `Step goal of ${formatInt(goals.value.steps)} reached.`
  return `${formatInt(goals.value.steps - steps)} steps to your goal of ${formatInt(goals.value.steps)}.`
})

const stepGoalDots = computed(() =>
  rangeDaysList.value.map((d) => {
    const s = d.activity?.steps
    return {
      key: d.date,
      label: String(Number(d.date.slice(8))),
      title: `${formatWeekday(d.date)}, ${formatShortDate(d.date)}: ${s == null ? 'not measured' : `${formatInt(s)} steps`}`,
      state: s == null ? ('none' as const) : s >= goals.value.steps ? ('met' as const) : ('missed' as const),
    }
  }),
)

const journal = useJournalStore()
const logged = computed(() => journal.onDate(fitness.selectedDate).activities)
const loggedKcal = computed(() => logged.value.reduce((n, e) => n + (e.energyKcal ?? 0), 0))

const rangeWorkouts = computed(() => rangeDaysList.value.reduce((n, d) => n + d.workouts.length, 0))
const recentWorkouts = computed(() =>
  rangeDaysList.value
    .flatMap((d) => d.workouts)
    .sort((x, y) => Date.parse(y.startAt) - Date.parse(x.startAt))
    .slice(0, 6),
)

const showAllHistory = ref(false)
const historyRows = computed(() => {
  const rows = [...rangeDaysList.value].reverse()
  return showAllHistory.value ? rows : rows.slice(0, 7)
})
</script>
