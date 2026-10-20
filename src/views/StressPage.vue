<template>
  <AppShell title="Stress">
    <template #subtitle>{{ formatLongDate(fitness.selectedDate) }} · {{ freshness }}</template>
    <DateToolbar />

    <DataState>
      <div class="grid gap-4">
        <ModuleHero
          title="Stress"
          tone="stress"
          :icon="ICONS.stress"
          :eyebrow="`Watch estimate · ${fitness.isToday ? 'today' : formatLongDate(fitness.selectedDate)}`"
          :headline="day?.stress ? String(day.stress.avg) : EMPTY"
          headline-unit="/ 100 average"
          :headline-ratio="day?.stress ? day.stress.avg / 100 : null"
          :spark="lastValues(rangeDaysList, (d) => d.stress?.avg)"
          spark-label="Average stress over the last 7 days"
          :sentence="sentence"
          :stats="[
            { label: 'Lowest', icon: arrowDown, value: score(day?.stress?.min), ratio: day?.stress ? day.stress.min / 100 : null },
            { label: 'Highest', icon: arrowUp, value: score(day?.stress?.max), ratio: day?.stress ? day.stress.max / 100 : null },
            { label: 'Latest reading', icon: ICONS.stress, value: latest ? score(latest.value) : EMPTY, note: latest ? `at ${formatClock(latest.at)}` : undefined },
            { label: 'Stress you felt', icon: ICONS.mood, value: selfReported == null ? EMPTY : `${selfReported} / 5`, note: 'from mood check-ins' },
          ]"
        />

        <div class="@container">
          <div class="grid items-start gap-4 @2xl:grid-cols-2 @[76rem]:grid-cols-3">
            <WidgetCard class="@2xl:col-span-2" title="Through the day" :icon="ICONS.stress" tone="stress" label="Readings" :value="String(readings.length)">
              <ReadingsChart
                :readings="readings"
                :loading="loading"
                :error="error"
                :height="CHART"
                color="var(--stress)"
                unit="/ 100"
                :y-domain="[0, 100]"
                description="Stress readings through the day, 0 to 100. Use arrow keys to step through readings."
                empty-text="No stress readings were recorded on this day."
                legend="Watch stress estimate, 0–100"
                @retry="load"
              />
            </WidgetCard>

            <WidgetCard title="Time in each range" :icon="ICONS.stress" tone="stress" label="Mostly" :value="topZone" :note="fitness.isToday ? 'today' : 'this day'">
              <BarList :height="AREA" v-if="readings.length" :rows="zoneRows" :scale-max="100" :description="zoneSummary" />
              <p v-else class="text-sm text-muted">No readings on this day.</p>
            </WidgetCard>

            <WidgetCard title="Daily average" :icon="ICONS.stress" tone="stress" label="Average of days" :value="score(rangeAvg)" :note="`${measured.length} of ${fitness.rangeDays} days`">
              <BarChart
                :bars="metricBars(rangeDaysList, (d) => d.stress?.avg, 'var(--stress)', (n) => `${n} / 100`)"
                :selected-key="fitness.selectedDate"
                :height="CHART"
                :format-tick="(n: number) => String(n)"
                value-name="Average stress"
                description="Average watch stress per day. Use arrow keys to inspect days and Enter to select one."
                @select="fitness.selectDate"
              >
                <template #legend><span class="flex items-center gap-1.5"><span class="size-2 rounded-sm bg-[var(--stress)]" aria-hidden="true" />Daily average, 0–100</span></template>
              </BarChart>
            </WidgetCard>

            <WidgetCard title="Daily range" :icon="ICONS.stress" tone="stress" label="Highest daily average" :value="measured.length ? score(Math.max(...measured)) : EMPTY">
              <BarChart
                :bars="rangeBars(rangeDaysList, (d) => (d.stress ? { min: d.stress.min, max: d.stress.max } : null), 'var(--zone-3)', (n) => String(Math.round(n)))"
                :selected-key="fitness.selectedDate"
                :height="CHART"
                :format-tick="(n: number) => String(n)"
                value-name="Stress range"
                description="Lowest to highest stress reading per day. Use arrow keys to inspect days and Enter to select one."
                @select="fitness.selectDate"
              >
                <template #legend><span class="flex items-center gap-1.5"><span class="h-2.5 w-1.5 rounded-sm bg-[var(--zone-3)]" aria-hidden="true" />Lowest to highest reading</span></template>
              </BarChart>
            </WidgetCard>

            <WidgetCard title="Stress you felt" :icon="ICONS.mood" tone="mood" label="Average" :value="feltAvg == null ? EMPTY : `${feltAvg.toFixed(1)} / 5`" note="your own ratings">
              <LineChart
                :points="feltPoints"
                :x-domain="[0, Math.max(1, rangeDaysList.length - 1)]"
                :x-ticks="edgeTicks"
                :mark-x="rangeDaysList.length - 1"
                :y-domain="[1, 5]"
                :max-gap="1"
                :height="CHART"
                color="var(--mood-ink)"
                unit="/ 5"
                x-name="Date"
                description="Stress you reported in mood check-ins, daily average from 1 to 5"
              >
                <template #legend><span class="flex items-center gap-1.5"><span class="h-0.5 w-3.5 rounded-full bg-[var(--mood-ink)]" aria-hidden="true" />Self-reported, 1–5 (separate from the watch)</span></template>
              </LineChart>
            </WidgetCard>
          </div>
        </div>

        <AboutNote>
          <ul class="max-w-prose list-disc space-y-1.5 pl-5 text-sm text-ink-2">
            <li>The watch estimates stress from heart-rate variability while you are still. It is not measured during sleep or exercise.</li>
            <li>It is separate from the stress you report yourself in <RouterLink to="/mood" class="font-medium text-accent underline underline-offset-2">mood check-ins</RouterLink>.</li>
            <li>FitApp shows the readings as recorded and does not interpret them medically.</li>
          </ul>
        </AboutNote>
      </div>
    </DataState>
  </AppShell>
</template>

<script setup lang="ts">
import { ICONS } from '@/components/metricIcons'
import { computed } from 'vue'
import { arrowDown, arrowUp } from 'ionicons/icons'
import AboutNote from '@/components/AboutNote.vue'
import AppShell from '@/components/AppShell.vue'
import BarChart from '@/components/charts/BarChart.vue'
import BarList from '@/components/charts/BarList.vue'
import LineChart from '@/components/charts/LineChart.vue'
import DataState from '@/components/DataState.vue'
import DateToolbar from '@/components/DateToolbar.vue'
import ModuleHero from '@/components/ModuleHero.vue'
import ReadingsChart from '@/components/ReadingsChart.vue'
import WidgetCard from '@/components/WidgetCard.vue'
import { useFitnessData } from '@/composables/useFitnessData'
import { useReadings } from '@/composables/useReadings'
import { dailyTicks, lastValues, metricBars, rangeBars } from '@/data/chartData'
import { mean } from '@/data/derive'
import { dailyMoodMean } from '@/data/journalDerive'
import { zoneShares } from '@/data/signals'
import { EMPTY, formatClock, formatLongDate, formatShortDate, formatWeekday } from '@/lib/format'
import { useJournalStore } from '@/stores/journal'

const CHART = 130
/** Content height of a chart widget (chart plus its legend row); list widgets fill the same height. */
const AREA = CHART + 28

const { fitness, freshness, rangeDaysList, selectedDay: day } = useFitnessData()
const { readings, loading, error, load } = useReadings('stress')
const journal = useJournalStore()

const score = (n: number | null | undefined) => (n == null ? EMPTY : `${Math.round(n)} / 100`)
const latest = computed(() => readings.value.at(-1) ?? null)
const edgeTicks = computed(() => dailyTicks(rangeDaysList.value).filter((_, i, all) => i === 0 || i === all.length - 1 || i === Math.floor(all.length / 2)))

const zones = computed(() => zoneShares(readings.value))
const zoneRows = computed(() => zones.value.map((z) => ({ label: `${z.label} ${z.min}–${z.max}`, value: z.share * 100, valueText: `${Math.round(z.share * 100)}%`, color: z.color })))
const zoneSummary = computed(() => zones.value.map((z) => `${z.label} ${Math.round(z.share * 100)}%`).join(', '))
const topZone = computed(() => (readings.value.length ? [...zones.value].sort((a, b) => b.share - a.share)[0].label : EMPTY))
const sentence = computed(() => {
  if (!day.value?.stress) return 'No stress readings were recorded on this day.'
  const top = [...zones.value].sort((a, b) => b.share - a.share)[0]
  return readings.value.length ? `${top.label} for ${Math.round(top.share * 100)}% of the day's ${readings.value.length} readings.` : `${day.value.stress.sampleCount} readings on this day.`
})

const measured = computed(() => rangeDaysList.value.map((d) => d.stress?.avg).filter((v): v is number => v != null))
const rangeAvg = computed(() => mean(measured.value))

const rangeMood = computed(() => {
  const first = rangeDaysList.value[0]?.date ?? fitness.selectedDate
  return journal.data.mood.filter((e) => e.date >= first && e.date <= fitness.selectedDate)
})
const feltByDay = computed(() => dailyMoodMean(rangeMood.value, (e) => e.stress))
const feltAvg = computed(() => mean([...feltByDay.value.values()]))
const feltPoints = computed(() =>
  rangeDaysList.value.map((d, i) => ({ x: i, label: `${formatWeekday(d.date)}, ${formatShortDate(d.date)}`, value: feltByDay.value.has(d.date) ? Math.round(feltByDay.value.get(d.date)! * 10) / 10 : null })),
)
const selfReported = computed(() => {
  const v = mean(journal.onDate(fitness.selectedDate).mood.map((e) => e.stress))
  return v == null ? null : Number(v.toFixed(1))
})
</script>
