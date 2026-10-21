<template>
  <AppShell title="Food">
    <template #subtitle>{{ formatLongDate(fitness.selectedDate) }} · meals you logged</template>
    <TrackerGate tracker="food">
      <DateToolbar />
      <JournalState>
        <div class="grid gap-4">
          <ModuleHero
            title="Food"
            tone="energy"
            :icon="ICONS.meals"
            :eyebrow="fitness.isToday ? 'What you logged today' : `What you logged, ${formatLongDate(fitness.selectedDate)}`"
            :headline="macros.kcal == null ? `${day.meals.length} meal${day.meals.length === 1 ? '' : 's'}` : formatInt(macros.kcal)"
            :headline-unit="macros.kcal == null ? undefined : `kcal from ${day.meals.length} meal${day.meals.length === 1 ? '' : 's'}`"
            :spark="lastValues(rangeDaysList, (d) => kcalByDay.get(d.date) ?? null)"
            spark-label="Food energy logged over the last 7 days"
            :sentence="energyLine || 'No meals logged on this day.'"
            :stats="[
              { label: 'Meals', icon: ICONS.meals, value: String(day.meals.length) },
              { label: 'Protein', icon: ICONS.meals, value: grams(macros.protein), ratio: macroShare(macros.protein, 4) },
              { label: 'Carbs', icon: ICONS.meals, value: grams(macros.carbs), ratio: macroShare(macros.carbs, 4) },
              { label: 'Fat', icon: ICONS.meals, value: grams(macros.fat), ratio: macroShare(macros.fat, 9) },
            ]"
          />

          <div class="@container">
            <div class="grid items-start gap-4 @2xl:grid-cols-2 @[76rem]:grid-cols-3">
              <WidgetCard title="Meals" :icon="ICONS.meals" tone="energy" :label="fitness.isToday ? 'Today' : 'This day'" :value="String(day.meals.length)">
                <div class="overflow-y-auto" :style="{ height: `${AREA}px` }">
                  <ul v-if="day.meals.length" class="divide-y divide-line">
                    <li v-for="m in day.meals" :key="m.id" class="py-2.5 first:pt-0">
                      <div class="flex items-start gap-3 text-sm">
                        <span class="tabular w-11 shrink-0 text-xs text-muted">{{ formatClock(m.eatenAt) }}</span>
                        <div class="min-w-0 flex-1">
                          <p class="font-medium capitalize">{{ m.mealType }}</p>
                          <p class="truncate text-xs text-ink-2">{{ m.items.map((i) => i.name).join(', ') }}</p>
                          <p v-if="mealKcal(m) != null" class="tabular text-xs text-muted">{{ formatInt(mealKcal(m)) }} kcal {{ energyOrigin(enteredEnergy([m])) }}</p>
                        </div>
                      </div>
                    </li>
                  </ul>
                  <p v-else class="text-sm text-muted">No meals logged on this day. Meals are logged in the FitApp mobile app.</p>
                </div>
              </WidgetCard>

              <WidgetCard title="Macronutrients" :icon="ICONS.meals" tone="energy" label="From" :value="`${macros.counted} of ${macros.items} foods`" note="with values">
                <DonutChart
                  v-if="macros.protein + macros.carbs + macros.fat > 0"
                  :height="AREA"
                  :parts="[
                    { label: 'Protein', value: macros.protein * 4, valueText: grams(macros.protein), color: 'var(--activity)' },
                    { label: 'Carbs', value: macros.carbs * 4, valueText: grams(macros.carbs), color: 'var(--energy)' },
                    { label: 'Fat', value: macros.fat * 9, valueText: grams(macros.fat), color: 'var(--heart)' },
                  ]"
                  :center-value="formatInt(macros.protein * 4 + macros.carbs * 4 + macros.fat * 9)"
                  center-label="kcal"
                  description="Share of food energy from protein, carbohydrates and fat on this day (4 kcal per gram of protein or carbs, 9 per gram of fat)"
                />
                <p v-else class="text-sm text-muted">No nutrient values for this day's foods.</p>
              </WidgetCard>

              <WidgetCard title="Food energy per day" :icon="ICONS.activeEnergy" tone="energy" label="Average on logged days" :value="mean([...kcalByDay.values()]) == null ? EMPTY : `${formatInt(mean([...kcalByDay.values()]))} kcal`">
                <BarChart
                  :bars="dayBars((d) => kcalByDay.get(d) ?? null, 'var(--energy)', (n) => `${formatInt(n)} kcal`)"
                  :selected-key="fitness.selectedDate"
                  :height="CHART"
                  value-name="Food energy"
                  description="Food energy logged per day, entered or estimated. Use arrow keys to inspect days and Enter to select one."
                  @select="fitness.selectDate"
                >
                  <template #legend><span class="flex items-center gap-1.5"><span class="size-2 rounded-sm bg-[var(--energy)]" aria-hidden="true" />Kcal you logged (not the watch's active energy)</span></template>
                </BarChart>
              </WidgetCard>

              <WidgetCard title="Meals by type" :icon="ICONS.meals" tone="energy" label="Meals logged" :value="String(range.meals.length)" :note="`on ${range.mealDays} of ${fitness.rangeDays} days`">
                <BarList :height="AREA" :rows="mealTypeRows" color="var(--energy)" :description="`Meals logged by type in the last ${fitness.rangeDays} days`" />
              </WidgetCard>
            </div>
          </div>

          <p class="max-w-prose text-xs text-muted">
            Food energy here is what you entered, or what FitApp estimated from typical values in its food list. It is kept separate from the active energy your watch
            estimates ({{ day.watchKcal == null ? 'none recorded' : `${formatInt(day.watchKcal)} kcal` }} on this day), and the two are never combined into a balance.
          </p>
        </div>
      </JournalState>
    </TrackerGate>
  </AppShell>
</template>

<script setup lang="ts">
import { ICONS } from '@/components/metricIcons'
import { computed } from 'vue'
import AppShell from '@/components/AppShell.vue'
import BarChart from '@/components/charts/BarChart.vue'
import BarList from '@/components/charts/BarList.vue'
import DonutChart from '@/components/charts/DonutChart.vue'
import DateToolbar from '@/components/DateToolbar.vue'
import JournalState from '@/components/JournalState.vue'
import ModuleHero from '@/components/ModuleHero.vue'
import TrackerGate from '@/components/TrackerGate.vue'
import WidgetCard from '@/components/WidgetCard.vue'
import { useJournalData } from '@/composables/useJournalData'
import { lastValues } from '@/data/chartData'
import { mean } from '@/data/derive'
import { energyOrigin, enteredEnergy } from '@/data/journalDerive'
import { EMPTY, formatClock, formatInt, formatLongDate, formatShortDate, formatWeekday } from '@/lib/format'
import { MEAL_TYPES, type Meal } from '@/types/journal'

const CHART = 130
const AREA = CHART + 28

const { fitness, journal, rangeDaysList } = useJournalData()

const day = computed(() => {
  const entries = journal.onDate(fitness.selectedDate)
  return { ...entries, watchKcal: fitness.selectedDay?.activity?.activeKcal ?? null }
})
const energyLine = computed(() => {
  const e = enteredEnergy(day.value.meals)
  if (!e.total) return ''
  return e.kcal == null ? `${e.total} foods, no energy values entered.` : `${formatInt(e.kcal)} kcal ${energyOrigin(e)} for ${e.entered} of ${e.total} foods.`
})
const mealKcal = (m: Meal) => enteredEnergy([m]).kcal

/** The day's macronutrients, summed over foods that have values. */
const macros = computed(() => {
  const items = day.value.meals.flatMap((m) => m.items)
  const sum = (k: 'proteinG' | 'carbsG' | 'fatG') => Math.round(items.reduce((a, i) => a + (i[k] ?? 0), 0) * 10) / 10
  return { protein: sum('proteinG'), carbs: sum('carbsG'), fat: sum('fatG'), kcal: enteredEnergy(day.value.meals).kcal, items: items.length, counted: items.filter((i) => i.proteinG != null).length }
})
const grams = (g: number) => (g ? `${g} g` : EMPTY)
/** Share of the day's macro energy (4 kcal/g protein and carbs, 9 kcal/g fat). */
const macroShare = (g: number, kcalPerG: number) => {
  const total = macros.value.protein * 4 + macros.value.carbs * 4 + macros.value.fat * 9
  return total ? (g * kcalPerG) / total : null
}

const range = computed(() => {
  const dates = new Set(rangeDaysList.value.map((d) => d.date))
  const meals = journal.data.meals.filter((m) => dates.has(m.date))
  return { meals, mealDays: new Set(meals.map((m) => m.date)).size }
})
const kcalByDay = computed(() => {
  const out = new Map<string, number>()
  for (const d of rangeDaysList.value) {
    const kcal = enteredEnergy(range.value.meals.filter((m) => m.date === d.date)).kcal
    if (kcal != null) out.set(d.date, kcal)
  }
  return out
})
const mealTypeRows = computed(() =>
  MEAL_TYPES.map((t) => {
    const n = range.value.meals.filter((m) => m.mealType === t).length
    return { label: t, value: n, valueText: String(n) }
  }),
)

function dayBars(pick: (date: string) => number | null, color: string, format: (n: number) => string) {
  const days = rangeDaysList.value
  return days.map((d) => {
    const v = pick(d.date)
    return {
      key: d.date,
      label: days.length <= 7 ? formatWeekday(d.date).slice(0, 2) : String(Number(d.date.slice(8))),
      title: `${formatWeekday(d.date)}, ${formatShortDate(d.date)}`,
      segments: v == null ? null : [{ value: v, color }],
      valueText: v == null ? 'Nothing logged' : format(v),
    }
  })
}
</script>
