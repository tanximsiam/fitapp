<template>
  <AppShell title="Periods">
    <template #subtitle>Periods and symptoms you recorded</template>
    <TrackerGate tracker="cycle">
      <JournalState>
        <ModuleHero
          class="mb-4"
          title="Periods"
          tone="cycle"
          :icon="ICONS.cycle"
          eyebrow="From the days you recorded"
          :headline="cycleDay == null ? 'No period yet' : `Day ${cycleDay}`"
          :headline-unit="cycleDay == null ? undefined : 'since your last period started'"
          :headline-ratio="cycleDay == null || summary.avgCycleDays == null ? null : cycleDay / summary.avgCycleDays"
          :sentence="heroSentence"
          :stats="[
            { label: 'Average cycle', icon: ICONS.cycle, value: summary.avgCycleDays == null ? EMPTY : `${Math.round(summary.avgCycleDays)} days`, note: summary.completedCycles ? `${summary.shortestCycleDays}–${summary.longestCycleDays} days` : undefined },
            { label: 'Average period', icon: water, value: summary.avgPeriodDays == null ? EMPTY : `${summary.avgPeriodDays.toFixed(1)} days` },
            { label: 'Recorded periods', icon: ICONS.combined, value: String(summary.recordedPeriods), note: `${summary.completedCycles} complete cycles` },
            { label: 'Symptom days', icon: ICONS.mood, value: String(symptomDays), note: 'last 30 days' },
          ]"
        >
          <template #actions>
            <PrimaryButton label="Log a period day" @click="ui.openQuickLog('cycle')" />
          </template>
        </ModuleHero>

        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <PanelSection :title="monthTitle">
            <template #aside>
              <div class="flex gap-1">
                <button type="button" :class="iconBtn" aria-label="Previous month" @click="shiftMonth(-1)"><ion-icon :icon="chevronBackOutline" aria-hidden="true" /></button>
                <button type="button" :class="iconBtn" aria-label="Next month" :disabled="month >= fitness.today.slice(0, 7)" @click="shiftMonth(1)">
                  <ion-icon :icon="chevronForwardOutline" aria-hidden="true" />
                </button>
              </div>
            </template>
            <div class="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wide text-muted" aria-hidden="true">
              <span v-for="d in ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']" :key="d" class="py-1">{{ d }}</span>
            </div>
            <div class="grid grid-cols-7 gap-1">
              <span v-for="n in leadingBlanks" :key="`b${n}`" aria-hidden="true" />
              <button
                v-for="cell in cells"
                :key="cell.date"
                type="button"
                :disabled="cell.date > fitness.today"
                :aria-pressed="cell.date === selected"
                :aria-label="cell.label"
                class="relative flex h-11 flex-col items-center sm:h-12 lg:h-[4.25rem] justify-center rounded-lg text-sm transition-colors duration-150 disabled:opacity-35"
                :class="[flowClass(cell.day?.flow ?? null), cell.date === selected ? 'ring-2 ring-ink ring-offset-1 ring-offset-surface' : '', cell.date === fitness.today ? 'font-semibold' : '']"
                @click="selected = cell.date"
              >
                <span class="tabular">{{ Number(cell.date.slice(8)) }}</span>
                <span v-if="cell.day?.symptoms.length" class="absolute bottom-1 size-1 rounded-full bg-current" aria-hidden="true" />
              </button>
            </div>
            <ul class="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
              <li v-for="f in LEGEND" :key="f.label" class="flex items-center gap-1.5"><span class="size-3 rounded" :class="flowClass(f.flow)" aria-hidden="true" />{{ f.label }}</li>
              <li class="flex items-center gap-1.5"><span class="size-1 rounded-full bg-ink" aria-hidden="true" />Symptoms recorded</li>
            </ul>
          </PanelSection>

          <PanelSection :title="formatLongDate(selected)">
            <CycleDayForm :key="`${selected}-${journal.data.cycleDays.length}`" :date="selected" :cancellable="false" @done="() => {}" />
          </PanelSection>
        </div>

        <PanelSection title="History" class="mt-6">
          <dl class="mb-2 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <MetricItem label="Recorded periods" :value="String(summary.recordedPeriods)" />
            <MetricItem label="Completed cycles" :value="String(summary.completedCycles)" />
            <MetricItem
              label="Average cycle"
              :value="summary.avgCycleDays == null ? EMPTY : `${Math.round(summary.avgCycleDays)} days`"
              :note="summary.completedCycles ? `${summary.shortestCycleDays}–${summary.longestCycleDays}, n=${summary.completedCycles}` : undefined"
            />
            <MetricItem label="Average period" :value="summary.avgPeriodDays == null ? EMPTY : `${summary.avgPeriodDays.toFixed(1)} days`" />
          </dl>
          <p class="mb-4 max-w-prose text-xs text-muted">
            Calculated only from the dates you recorded in the last 6 months. A cycle counts once the next period has started. FitApp does not
            predict periods or fertile days and does not give medical or contraceptive advice.
          </p>
          <HistoryList
            v-if="periods.length"
            :rows="
              [...periods].reverse().map((p) => ({
                key: p.start,
                title: `Period from ${formatShortDate(p.start)}, ${p.start.slice(0, 4)}`,
                value: `${p.lengthDays} days`,
                detail: `Cycle ${cycleLength(p.start) ?? 'in progress'}${earlySymptoms(p) ? ` · first days: ${earlySymptoms(p)}` : ''}`,
                selected: p.start === selected,
              }))
            "
            @select="jumpTo"
          />
          <p v-else class="text-sm text-muted">No periods recorded yet. Select a day in the calendar to record bleeding or symptoms.</p>
        </PanelSection>
      </JournalState>
    </TrackerGate>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { IonIcon } from '@ionic/vue'
import { chevronBackOutline, chevronForwardOutline, water } from 'ionicons/icons'
import AppShell from '@/components/AppShell.vue'
import CycleDayForm from '@/components/forms/CycleDayForm.vue'
import HistoryList from '@/components/HistoryList.vue'
import JournalState from '@/components/JournalState.vue'
import { ICONS } from '@/components/metricIcons'
import ModuleHero from '@/components/ModuleHero.vue'
import MetricItem from '@/components/MetricItem.vue'
import PanelSection from '@/components/PanelSection.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import TrackerGate from '@/components/TrackerGate.vue'
import { useJournalData } from '@/composables/useJournalData'
import { cycleSummary, deriveCycles, derivePeriods, periodDayIndex, type Period } from '@/data/cycle'
import { addDays, daysBetween, weekday } from '@/lib/dates'
import { EMPTY, formatLongDate, formatShortDate } from '@/lib/format'
import { useUiStore } from '@/stores/ui'
import type { Flow } from '@/types/journal'

const { fitness, journal } = useJournalData()
const ui = useUiStore()

const selected = ref(fitness.selectedDate)
const month = ref(fitness.selectedDate.slice(0, 7))
const iconBtn = 'grid size-8 place-items-center rounded-lg border border-line text-ink-2 hover:border-line-strong disabled:opacity-35'

const monthTitle = computed(() => new Date(`${month.value}-01T00:00:00Z`).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }))
const leadingBlanks = computed(() => weekday(`${month.value}-01`))
const cells = computed(() => {
  const first = `${month.value}-01`
  const out = []
  for (let d = first; d.slice(0, 7) === month.value; d = addDays(d, 1)) {
    const day = journal.data.cycleDays.find((c) => c.date === d) ?? null
    const parts = [formatLongDate(d), day?.flow ? `${day.flow} flow` : null, day?.symptoms.length ? day.symptoms.join(', ').replace(/_/g, ' ') : null]
    out.push({ date: d, day, label: parts.filter(Boolean).join(', ') })
  }
  return out
})

function shiftMonth(step: number) {
  const [y, m] = month.value.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + step, 1))
  month.value = d.toISOString().slice(0, 7)
}

function jumpTo(date: string) {
  month.value = date.slice(0, 7)
  selected.value = date
}

const LEGEND: { flow: Flow; label: string }[] = [
  { flow: 'spotting', label: 'Spotting' },
  { flow: 'light', label: 'Light' },
  { flow: 'medium', label: 'Medium' },
  { flow: 'heavy', label: 'Heavy' },
]
// One hue (the flow red), light to dark with intensity; each day's flow is also in its accessible label.
const FLOW_CLASS: Record<Flow, string> = {
  spotting: 'border border-dashed border-[var(--spo2)] text-ink',
  light: 'bg-[var(--spo2-soft)] text-ink',
  medium: 'bg-[color-mix(in_srgb,var(--spo2)_45%,transparent)] text-ink',
  heavy: 'bg-[var(--spo2)] text-white',
}
const flowClass = (flow: Flow | null) => (flow ? FLOW_CLASS[flow] : 'text-ink-2 hover:bg-page')

const periods = computed(() => derivePeriods(journal.data.cycleDays))
const cycles = computed(() => deriveCycles(periods.value))
const summary = computed(() => cycleSummary(cycles.value, periods.value))

/** Days since the last recorded period started (counted from the records, never predicted). */
const lastPeriod = computed(() => periods.value.at(-1) ?? null)
const cycleDay = computed(() => (lastPeriod.value ? daysBetween(lastPeriod.value.start, fitness.today) + 1 : null))
const heroSentence = computed(() =>
  lastPeriod.value
    ? `Your last recorded period started ${formatShortDate(lastPeriod.value.start)} and lasted ${lastPeriod.value.lengthDays} days. FitApp does not predict periods.`
    : 'Record bleeding on a day to start tracking. FitApp does not predict periods.',
)
const symptomDays = computed(() => journal.data.cycleDays.filter((d) => d.symptoms.length && d.date > addDays(fitness.today, -30)).length)
const cycleLength = (start: string) => {
  const c = cycles.value.find((x) => x.start === start)
  return c ? `${c.lengthDays} days` : null
}
const earlySymptoms = (p: Period) =>
  [...new Set(p.days.filter((d) => (periodDayIndex(p, d.date) ?? 9) <= 2).flatMap((d) => d.symptoms))].join(', ').replace(/_/g, ' ')
</script>
