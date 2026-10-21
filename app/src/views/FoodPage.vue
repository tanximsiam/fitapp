<template>
  <AppShell title="Food & drink" clear-fab>
    <template #subtitle>{{ formatLongDate(fitness.selectedDate) }} · meals and drinks you logged</template>
    <TrackerGate tracker="food">
      <DateToolbar />
      <JournalState>
        <div class="grid gap-4">
          <ModuleHero
            title="Food and drink"
            tone="energy"
            :icon="ICONS.meals"
            :eyebrow="fitness.isToday ? 'What you logged today' : `What you logged, ${formatLongDate(fitness.selectedDate)}`"
            :headline="macros.kcal == null ? `${day.meals.length} meal${day.meals.length === 1 ? '' : 's'}` : formatInt(macros.kcal)"
            :headline-unit="macros.kcal == null ? undefined : `kcal from ${day.meals.length} meal${day.meals.length === 1 ? '' : 's'}`"
            :spark="lastValues(rangeDaysList, (d) => kcalByDay.get(d.date) ?? null)"
            spark-label="Food energy logged over the last 7 days"
            :sentence="energyLine || 'No meals logged on this day.'"
            :stats="[
              { label: 'Water', icon: ICONS.water, value: day.waterMl ? `${formatInt(day.waterMl)} ml` : EMPTY, note: `${day.hydration.length} drink${day.hydration.length === 1 ? '' : 's'}` },
              { label: 'Protein', icon: ICONS.meals, value: grams(macros.protein), ratio: macroShare(macros.protein, 4) },
              { label: 'Carbs', icon: ICONS.meals, value: grams(macros.carbs), ratio: macroShare(macros.carbs, 4) },
              { label: 'Fat', icon: ICONS.meals, value: grams(macros.fat), ratio: macroShare(macros.fat, 9) },
            ]"
          >
            <template #actions>
              <PrimaryButton v-if="fitness.isToday" label="Log meal" @click="ui.openQuickLog('meal')" />
              <PrimaryButton v-if="fitness.isToday" label="+ 250 ml water" :disabled="quickSaving" @click="quickWater" />
              <p v-if="quickError" role="alert" class="text-sm">{{ quickError }}</p>
            </template>
          </ModuleHero>

          <div class="@container">
            <div class="grid items-start gap-4 @2xl:grid-cols-2 @[76rem]:grid-cols-3">
              <WidgetCard title="Meals" :icon="ICONS.meals" tone="energy" :label="fitness.isToday ? 'Today' : 'This day'" :value="String(day.meals.length)">
                <div class="overflow-y-auto" :style="editing || addingMeal ? undefined : { height: `${AREA}px` }">
                  <ul v-if="day.meals.length" class="divide-y divide-line">
                    <li v-for="m in day.meals" :key="m.id" class="py-2.5 first:pt-0">
                      <MealForm v-if="editing === m.id" :date="m.date" :existing="m" @done="editing = null" />
                      <div v-else class="flex items-start gap-3 text-sm">
                        <span class="tabular w-11 shrink-0 text-xs text-muted">{{ formatClock(m.eatenAt) }}</span>
                        <div class="min-w-0 flex-1">
                          <p class="font-medium capitalize">{{ m.mealType }}</p>
                          <p class="truncate text-xs text-ink-2">{{ m.items.map((i) => i.name).join(', ') }}</p>
                          <p v-if="mealKcal(m) != null" class="tabular text-xs text-muted">{{ formatInt(mealKcal(m)) }} kcal {{ energyOrigin(enteredEnergy([m])) }}</p>
                        </div>
                        <button type="button" class="text-xs font-medium text-accent underline underline-offset-2" @click="editing = m.id">Edit</button>
                      </div>
                    </li>
                  </ul>
                  <p v-else class="text-sm text-muted">No meals logged on this day.</p>
                  <div v-if="addingMeal" class="mt-3 border-t border-line pt-3"><MealForm :date="fitness.selectedDate" @done="addingMeal = false" /></div>
                  <button v-else-if="!fitness.isToday" type="button" class="mt-3 text-sm font-medium text-accent underline underline-offset-2" @click="addingMeal = true">Add a meal for this day</button>
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

              <WidgetCard title="Water" :icon="ICONS.water" tone="activity" :label="fitness.isToday ? 'Today' : 'This day'" :value="day.waterMl ? `${formatInt(day.waterMl)} ml` : EMPTY">
                <div class="overflow-y-auto" :style="editingDrinkEntry || addingDrink ? undefined : { height: `${AREA}px` }">
                  <ul v-if="day.hydration.length" class="flex flex-wrap gap-2">
                    <li v-for="h in day.hydration" :key="h.id">
                      <button
                        type="button"
                        class="rounded-lg bg-page px-3 py-1.5 text-sm transition-colors duration-150 hover:bg-[var(--activity-soft)]"
                        :aria-label="`Edit ${h.volumeMl} ml at ${formatClock(h.recordedAt)}`"
                        @click="editingDrink = h.id"
                      >
                        <span class="tabular font-medium">{{ h.volumeMl }} ml</span> <span class="text-xs text-muted">{{ formatClock(h.recordedAt) }}</span>
                      </button>
                    </li>
                  </ul>
                  <p v-else class="text-sm text-muted">No drinks logged on this day.</p>
                  <div v-if="editingDrinkEntry" class="mt-3 border-t border-line pt-3">
                    <DrinkForm :key="String(editingDrink)" :date="fitness.selectedDate" :existing="editingDrinkEntry" @done="editingDrink = null" />
                  </div>
                  <div v-else-if="addingDrink" class="mt-3 border-t border-line pt-3"><DrinkForm :date="fitness.selectedDate" @done="addingDrink = false" /></div>
                  <button v-else type="button" class="mt-3 text-sm font-medium text-accent underline underline-offset-2" @click="addingDrink = true">Add a drink…</button>
                </div>
              </WidgetCard>

              <WidgetCard title="Water per day" :icon="ICONS.water" tone="activity" label="Average on logged days" :value="range.avgWater == null ? EMPTY : `${formatInt(range.avgWater)} ml`">
                <BarChart
                  :bars="dayBars((d) => range.water.get(d) ?? null, 'var(--activity)', (n) => `${formatInt(n)} ml`)"
                  :selected-key="fitness.selectedDate"
                  :height="CHART"
                  value-name="Water"
                  description="Water logged per day. Use arrow keys to inspect days and Enter to select one."
                  @select="fitness.selectDate"
                >
                  <template #legend><span class="flex items-center gap-1.5"><span class="size-2 rounded-sm bg-activity" aria-hidden="true" />Millilitres logged</span></template>
                </BarChart>
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
import { computed, ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import BarChart from '@/components/charts/BarChart.vue'
import BarList from '@/components/charts/BarList.vue'
import DonutChart from '@/components/charts/DonutChart.vue'
import DateToolbar from '@/components/DateToolbar.vue'
import DrinkForm from '@/components/forms/DrinkForm.vue'
import MealForm from '@/components/forms/MealForm.vue'
import JournalState from '@/components/JournalState.vue'
import ModuleHero from '@/components/ModuleHero.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import TrackerGate from '@/components/TrackerGate.vue'
import WidgetCard from '@/components/WidgetCard.vue'
import { useJournalData } from '@/composables/useJournalData'
import { lastValues } from '@/data/chartData'
import { mean } from '@/data/derive'
import { energyOrigin, enteredEnergy } from '@/data/journalDerive'
import { defaultInputFor, localInputToIso } from '@/lib/instants'
import { EMPTY, formatClock, formatInt, formatLongDate, formatShortDate, formatWeekday } from '@/lib/format'
import { useUiStore } from '@/stores/ui'
import { MEAL_TYPES, type EntryId, type Meal } from '@/types/journal'

const CHART = 130
const AREA = CHART + 28

const { fitness, journal, rangeDaysList } = useJournalData()
const ui = useUiStore()
const editing = ref<EntryId | null>(null)
const editingDrink = ref<EntryId | null>(null)
const addingMeal = ref(false)
const addingDrink = ref(false)
const quickSaving = ref(false)
const quickError = ref<string | null>(null)

const day = computed(() => {
  const entries = journal.onDate(fitness.selectedDate)
  return { ...entries, waterMl: entries.hydration.reduce((a, h) => a + h.volumeMl, 0), watchKcal: fitness.selectedDay?.activity?.activeKcal ?? null }
})
const editingDrinkEntry = computed(() => day.value.hydration.find((h) => h.id === editingDrink.value))
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
  const water = new Map<string, number>()
  for (const h of journal.data.hydration) if (dates.has(h.date)) water.set(h.date, (water.get(h.date) ?? 0) + h.volumeMl)
  return { meals, mealDays: new Set(meals.map((m) => m.date)).size, water, avgWater: mean([...water.values()]) }
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
