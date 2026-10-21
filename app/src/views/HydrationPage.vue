<template>
  <AppShell title="Hydration" clear-fab>
    <template #subtitle>{{ formatLongDate(fitness.selectedDate) }} · water you logged</template>
    <TrackerGate tracker="hydration">
      <DateToolbar />
      <JournalState>
        <div class="grid gap-4">
          <ModuleHero
            title="Hydration"
            tone="activity"
            :icon="ICONS.water"
            :eyebrow="fitness.isToday ? 'Water today' : `Water, ${formatLongDate(fitness.selectedDate)}`"
            :headline="formatInt(day.ml)"
            :headline-unit="`ml of ${formatInt(goal)}`"
            :headline-ratio="day.ml / goal"
            :spark="lastValues(rangeDaysList, (d) => water.get(d.date) ?? null)"
            spark-label="Water logged over the last 7 days"
            :sentence="sentence"
            :stats="[
              { label: 'Drinks', icon: ICONS.water, value: String(day.entries.length) },
              { label: `${fitness.rangeDays}-day average`, icon: ICONS.water, value: average == null ? EMPTY : `${formatInt(average)} ml`, ratio: average == null ? null : average / goal },
              { label: 'Goal days', icon: ICONS.water, value: `${goalDays} of ${fitness.rangeDays}`, ratio: goalDays / fitness.rangeDays },
              { label: 'Best day', icon: ICONS.water, value: best == null ? EMPTY : `${formatInt(best)} ml` },
            ]"
          >
            <template #actions>
              <PrimaryButton v-if="fitness.isToday" label="Log a drink" @click="ui.openQuickLog('drink')" />
              <PrimaryButton v-if="fitness.isToday" label="+ 250 ml" :disabled="quickSaving" @click="quickWater" />
              <p v-if="quickError" role="alert" class="text-sm">{{ quickError }}</p>
            </template>
          </ModuleHero>

          <div class="@container">
            <div class="grid items-start gap-4 @2xl:grid-cols-2 @[76rem]:grid-cols-3">
              <WidgetCard title="Drinks" :icon="ICONS.water" tone="activity" :label="fitness.isToday ? 'Today' : 'This day'" :value="`${formatInt(day.ml)} ml`">
                <div class="overflow-y-auto" :style="editingEntry || adding ? undefined : { height: `${AREA}px` }">
                  <ul v-if="day.entries.length" class="flex flex-wrap gap-2">
                    <li v-for="h in day.entries" :key="h.id">
                      <button
                        type="button"
                        class="rounded-lg bg-page px-3 py-1.5 text-sm transition-colors duration-150 hover:bg-[var(--activity-soft)]"
                        :aria-label="`Edit ${h.volumeMl} ml at ${formatClock(h.recordedAt)}`"
                        @click="editing = h.id"
                      >
                        <span class="tabular font-medium">{{ h.volumeMl }} ml</span> <span class="text-xs text-muted">{{ formatClock(h.recordedAt) }}</span>
                      </button>
                    </li>
                  </ul>
                  <p v-else class="text-sm text-muted">No drinks logged on this day.</p>
                  <div v-if="editingEntry" class="mt-3 border-t border-line pt-3">
                    <DrinkForm :key="String(editing)" :date="fitness.selectedDate" :existing="editingEntry" @done="editing = null" />
                  </div>
                  <div v-else-if="adding" class="mt-3 border-t border-line pt-3"><DrinkForm :date="fitness.selectedDate" @done="adding = false" /></div>
                  <button v-else type="button" class="mt-3 text-sm font-medium text-accent underline underline-offset-2" @click="adding = true">Add a drink…</button>
                </div>
              </WidgetCard>

              <WidgetCard title="Water per day" :icon="ICONS.water" tone="activity" label="Average on logged days" :value="average == null ? EMPTY : `${formatInt(average)} ml`">
                <BarChart
                  :bars="bars"
                  :selected-key="fitness.selectedDate"
                  :height="CHART"
                  value-name="Water"
                  description="Water logged per day. Use arrow keys to inspect days and Enter to select one."
                  @select="fitness.selectDate"
                >
                  <template #legend><span class="flex items-center gap-1.5"><span class="size-2 rounded-sm bg-activity" aria-hidden="true" />Millilitres logged · goal {{ formatInt(goal) }} ml</span></template>
                </BarChart>
              </WidgetCard>

              <WidgetCard title="Goal days" :icon="ICONS.water" tone="activity" label="Reached on" :value="`${goalDays} of ${fitness.rangeDays}`" note="days">
                <GoalDots :height="AREA" :days="dots" color="var(--activity)" what="Water goal" met-label="Goal reached" missed-label="Below goal" />
              </WidgetCard>
            </div>
          </div>
        </div>
      </JournalState>
    </TrackerGate>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import BarChart from '@/components/charts/BarChart.vue'
import GoalDots from '@/components/charts/GoalDots.vue'
import DateToolbar from '@/components/DateToolbar.vue'
import DrinkForm from '@/components/forms/DrinkForm.vue'
import JournalState from '@/components/JournalState.vue'
import { ICONS } from '@/components/metricIcons'
import ModuleHero from '@/components/ModuleHero.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import TrackerGate from '@/components/TrackerGate.vue'
import WidgetCard from '@/components/WidgetCard.vue'
import { useJournalData } from '@/composables/useJournalData'
import { lastValues } from '@/data/chartData'
import { mean } from '@/data/derive'
import { defaultInputFor, localInputToIso } from '@/lib/instants'
import { EMPTY, formatClock, formatInt, formatLongDate, formatShortDate, formatWeekday } from '@/lib/format'
import { useUiStore } from '@/stores/ui'
import type { EntryId } from '@/types/journal'

const CHART = 130
const AREA = CHART + 28

const { fitness, journal, rangeDaysList } = useJournalData()
const ui = useUiStore()
const editing = ref<EntryId | null>(null)
const adding = ref(false)
const quickSaving = ref(false)
const quickError = ref<string | null>(null)

const goal = computed(() => fitness.goals.waterMl)
const day = computed(() => {
  const entries = journal.onDate(fitness.selectedDate).hydration
  return { entries, ml: entries.reduce((a, h) => a + h.volumeMl, 0) }
})
const editingEntry = computed(() => day.value.entries.find((h) => h.id === editing.value))

/** Millilitres per date in the visible range (days with nothing logged are absent). */
const water = computed(() => {
  const dates = new Set(rangeDaysList.value.map((d) => d.date))
  const out = new Map<string, number>()
  for (const h of journal.data.hydration) if (dates.has(h.date)) out.set(h.date, (out.get(h.date) ?? 0) + h.volumeMl)
  return out
})
const average = computed(() => mean([...water.value.values()]))
const best = computed(() => (water.value.size ? Math.max(...water.value.values()) : null))
const goalDays = computed(() => [...water.value.values()].filter((ml) => ml >= goal.value).length)

const sentence = computed(() => {
  const left = goal.value - day.value.ml
  if (!day.value.entries.length) return fitness.isToday ? 'Nothing logged yet today.' : 'No drinks logged on this day.'
  if (left <= 0) return 'Daily goal reached.'
  return `${formatInt(left)} ml to go${fitness.isToday ? ' today' : ''}.`
})

const bars = computed(() =>
  rangeDaysList.value.map((d) => {
    const v = water.value.get(d.date) ?? null
    return {
      key: d.date,
      label: rangeDaysList.value.length <= 7 ? formatWeekday(d.date).slice(0, 2) : String(Number(d.date.slice(8))),
      title: `${formatWeekday(d.date)}, ${formatShortDate(d.date)}`,
      segments: v == null ? null : [{ value: v, color: 'var(--activity)' }],
      valueText: v == null ? 'Nothing logged' : `${formatInt(v)} ml`,
    }
  }),
)

const dots = computed(() =>
  rangeDaysList.value.map((d) => {
    const ml = water.value.get(d.date) ?? 0
    return {
      key: d.date,
      label: String(Number(d.date.slice(8))),
      title: `${formatWeekday(d.date)}, ${formatShortDate(d.date)}: ${formatInt(ml)} ml`,
      state: ml >= goal.value ? ('met' as const) : ('missed' as const),
    }
  }),
)

async function quickWater() {
  quickSaving.value = true
  quickError.value = null
  try {
    await journal.saveHydration({ recordedAt: localInputToIso(defaultInputFor(fitness.today)), volumeMl: 250 })
  } catch (err) {
    quickError.value = err instanceof Error ? err.message : 'Could not save.'
  } finally {
    quickSaving.value = false
  }
}
</script>
