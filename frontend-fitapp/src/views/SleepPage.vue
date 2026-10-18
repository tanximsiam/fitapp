<template>
  <AppShell title="Sleep">
    <template #subtitle>Night ending {{ formatLongDate(fitness.selectedDate) }} · {{ freshness }}</template>
    <DateToolbar />

    <DataState>
      <div class="grid gap-4">
        <PanelSection title="This night" tone="sleep">
          <template v-if="day?.sleep">
            <dl class="mb-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              <MetricItem label="In bed" :icon="ICONS.bedtime" :value="formatDuration(day.sleep.durationMin)" />
              <MetricItem label="Asleep" :icon="ICONS.sleep" :value="formatDuration(asleepMin)" />
              <MetricItem label="Bedtime – wake" :icon="ICONS.bedtime" :value="`${formatClock(day.sleep.startAt)}–${formatClock(day.sleep.endAt)}`" />
              <MetricItem label="Sleep score" :value="formatInt(day.sleep.score)" note="reported by device" />
            </dl>
            <SleepStages v-if="day.sleep.stages" :stages="day.sleep.stages" />
            <p v-else class="text-sm text-muted">The source did not report sleep stages for this night.</p>
          </template>
          <p v-else class="text-sm text-muted">No sleep was recorded for the night ending on this day.</p>
        </PanelSection>

        <PanelSection :title="`Nightly sleep, last ${fitness.rangeDays} nights`">
          <dl class="mb-5 grid grid-cols-3 gap-4">
            <MetricItem label="Average in bed" :value="formatDuration(avg((d) => d.sleep?.durationMin))" />
            <MetricItem label="Average deep" :value="formatDuration(avg((d) => d.sleep?.stages?.deepMin))" />
            <MetricItem label="Average score" :value="formatInt(avg((d) => d.sleep?.score))" />
          </dl>
          <BarChart
            :bars="sleepBars(rangeDaysList)"
            :selected-key="fitness.selectedDate"
            :goal="goals.sleepMin / 60"
            :goal-label="`Goal ${formatDuration(goals.sleepMin)}`"
            :format-tick="(h: number) => `${h}h`"
            value-name="Sleep"
            description="Sleep per night by stage. Use arrow keys to inspect nights and Enter to select one."
            @select="fitness.selectDate"
          >
            <template #legend>
              <span v-for="s in [...SLEEP_STAGES].reverse()" :key="s.key" class="flex items-center gap-1.5">
                <span class="size-2.5 rounded-sm" :style="{ background: s.color }" aria-hidden="true" />{{ s.label }}
              </span>
            </template>
          </BarChart>
        </PanelSection>
      </div>
    </DataState>
  </AppShell>
</template>

<script setup lang="ts">
import { ICONS } from '@/components/metricIcons'
import { computed } from 'vue'
import AppShell from '@/components/AppShell.vue'
import BarChart from '@/components/charts/BarChart.vue'
import DataState from '@/components/DataState.vue'
import DateToolbar from '@/components/DateToolbar.vue'
import MetricItem from '@/components/MetricItem.vue'
import PanelSection from '@/components/PanelSection.vue'
import SleepStages from '@/components/SleepStages.vue'
import { SLEEP_STAGES } from '@/components/sleepStages'
import { useFitnessData } from '@/composables/useFitnessData'
import { sleepBars } from '@/data/chartData'
import { mean } from '@/data/derive'
import { formatClock, formatDuration, formatInt, formatLongDate } from '@/lib/format'
import type { DaySummary } from '@/types/fitness'

const { fitness, freshness, goals, rangeDaysList, selectedDay: day } = useFitnessData()

const asleepMin = computed(() => {
  const s = day.value?.sleep
  return s && s.stages?.awakeMin != null ? s.durationMin - s.stages.awakeMin : null
})
const avg = (pick: (d: DaySummary) => number | null | undefined) => mean(rangeDaysList.value.map(pick))
</script>
