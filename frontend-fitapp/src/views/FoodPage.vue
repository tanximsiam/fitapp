<template>
  <AppShell title="Food & drink">
    <template #subtitle>{{ formatLongDate(fitness.selectedDate) }} · meals and drinks you logged</template>
    <template #actions>
      <PrimaryButton label="Log meal" @click="ui.openQuickLog('meal')" />
    </template>

    <TrackerGate tracker="food">
      <DateToolbar />
      <JournalState>
        <div class="grid gap-4">
          <PanelSection title="Meals">
            <template #aside>
              <p class="text-xs text-muted">{{ energyLine }}</p>
            </template>
            <ul v-if="day.meals.length" class="divide-y divide-line border-y border-line">
              <li v-for="m in day.meals" :key="m.id" class="py-3">
                <MealForm v-if="editing === m.id" :date="m.date" :existing="m" @done="editing = null" />
                <div v-else class="flex flex-wrap items-start gap-x-6 gap-y-1 text-sm">
                  <span class="tabular w-12 text-ink-2">{{ formatClock(m.eatenAt) }}</span>
                  <div class="min-w-0 flex-1">
                    <p class="font-medium capitalize">{{ m.mealType }}</p>
                    <ul class="mt-0.5 text-ink-2">
                      <li v-for="(i, k) in m.items" :key="k">
                        {{ i.name }}<template v-if="i.quantity != null"> · {{ i.quantity }} {{ i.unit ?? '' }}</template>
                        <span class="tabular text-muted">
                          <template v-if="i.energyKcal != null"> · {{ formatInt(i.energyKcal) }} kcal {{ i.nutritionSource === 'database' ? 'estimated' : 'entered' }}</template>
                          <template v-if="i.proteinG != null"> · P {{ i.proteinG }} g</template>
                          <template v-if="i.carbsG != null"> · C {{ i.carbsG }} g</template>
                          <template v-if="i.fatG != null"> · F {{ i.fatG }} g</template>
                        </span>
                      </li>
                    </ul>
                    <p v-if="m.note" class="mt-1 text-ink-2 italic">“{{ m.note }}”</p>
                  </div>
                  <EntryBadge :kind="m.provenance" />
                  <button type="button" class="text-xs font-medium text-accent underline underline-offset-2" @click="editing = m.id">Edit</button>
                </div>
              </li>
            </ul>
            <p v-else class="text-sm text-muted">No meals logged on this day.</p>
            <div v-if="addingMeal" class="mt-4 border-t border-line pt-4"><MealForm :date="fitness.selectedDate" @done="addingMeal = false" /></div>
            <button v-else type="button" class="mt-4 text-sm font-medium text-accent underline underline-offset-2" @click="addingMeal = true">Add a meal for this day</button>
            <p class="mt-4 max-w-prose text-xs text-muted">
              Food energy here is what you entered, or what FitApp estimated from typical values in its food list (marked “estimated”). It is kept separate from the active energy your watch estimates
              ({{ day.watchKcal == null ? 'none recorded' : `${formatInt(day.watchKcal)} kcal` }} on this day), and the two are never combined into a balance.
            </p>
          </PanelSection>

          <PanelSection title="Water and drinks" tone="activity">
            <template #aside>
              <p class="tabular text-sm font-semibold">{{ day.waterMl ? `${formatInt(day.waterMl)} ml` : 'None logged' }}</p>
            </template>
            <ul v-if="day.hydration.length" class="flex flex-wrap gap-2">
              <li v-for="h in day.hydration" :key="h.id">
                <button
                  type="button"
                  class="rounded-lg border border-line px-3 py-1.5 text-sm transition-colors duration-150 hover:border-line-strong"
                  :aria-label="`Edit ${h.volumeMl} ml at ${formatClock(h.recordedAt)}`"
                  @click="editingDrink = h.id"
                >
                  <span class="tabular">{{ h.volumeMl }} ml</span> <span class="text-xs text-muted">{{ formatClock(h.recordedAt) }}</span>
                </button>
              </li>
            </ul>
            <div v-if="editingDrinkEntry" class="mt-4 border-t border-line pt-4">
              <DrinkForm :key="String(editingDrink)" :date="fitness.selectedDate" :existing="editingDrinkEntry" @done="editingDrink = null" />
            </div>
            <div v-else-if="addingDrink" class="mt-4 border-t border-line pt-4"><DrinkForm :date="fitness.selectedDate" @done="addingDrink = false" /></div>
            <div v-else class="mt-4 flex flex-wrap gap-2">
              <PrimaryButton variant="secondary" label="+ 250 ml now" :disabled="!fitness.isToday || quickSaving" @click="quickWater" />
              <PrimaryButton variant="secondary" label="Add a drink…" @click="addingDrink = true" />
            </div>
            <p v-if="quickError" role="alert" class="mt-2 text-sm text-danger">{{ quickError }}</p>
          </PanelSection>

          <PanelSection :title="`Last ${fitness.rangeDays} days`">
            <dl class="mb-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <MetricItem label="Days with meals logged" :value="`${range.mealDays} of ${fitness.rangeDays}`" />
              <MetricItem label="Meals logged" :value="String(range.meals)" />
              <MetricItem label="Average water on logged days" :value="range.avgWater == null ? EMPTY : `${formatInt(range.avgWater)} ml`" />
            </dl>
            <BarChart
              :bars="waterBars"
              :selected-key="fitness.selectedDate"
              value-name="Water"
              description="Water logged per day. Use arrow keys to inspect days and Enter to select one."
              @select="fitness.selectDate"
            />
          </PanelSection>
        </div>
      </JournalState>
    </TrackerGate>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import BarChart from '@/components/charts/BarChart.vue'
import DateToolbar from '@/components/DateToolbar.vue'
import EntryBadge from '@/components/EntryBadge.vue'
import DrinkForm from '@/components/forms/DrinkForm.vue'
import MealForm from '@/components/forms/MealForm.vue'
import JournalState from '@/components/JournalState.vue'
import MetricItem from '@/components/MetricItem.vue'
import PanelSection from '@/components/PanelSection.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import TrackerGate from '@/components/TrackerGate.vue'
import { useJournalData } from '@/composables/useJournalData'
import { mean } from '@/data/derive'
import { energyOrigin, enteredEnergy } from '@/data/journalDerive'
import { localInputToIso, defaultInputFor } from '@/lib/instants'
import { EMPTY, formatClock, formatInt, formatLongDate, formatShortDate, formatWeekday } from '@/lib/format'
import { useUiStore } from '@/stores/ui'
import type { EntryId } from '@/types/journal'

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
  return {
    ...entries,
    waterMl: entries.hydration.reduce((a, h) => a + h.volumeMl, 0),
    watchKcal: fitness.selectedDay?.activity?.activeKcal ?? null,
  }
})
const editingDrinkEntry = computed(() => day.value.hydration.find((h) => h.id === editingDrink.value))

const energyLine = computed(() => {
  const e = enteredEnergy(day.value.meals)
  if (!e.total) return ''
  return e.kcal == null ? 'No energy values entered' : `${formatInt(e.kcal)} kcal ${energyOrigin(e)} for ${e.entered} of ${e.total} foods`
})

const range = computed(() => {
  const dates = new Set(rangeDaysList.value.map((d) => d.date))
  const meals = journal.data.meals.filter((m) => dates.has(m.date))
  const water = new Map<string, number>()
  for (const h of journal.data.hydration) if (dates.has(h.date)) water.set(h.date, (water.get(h.date) ?? 0) + h.volumeMl)
  return { meals: meals.length, mealDays: new Set(meals.map((m) => m.date)).size, water, avgWater: mean([...water.values()]) }
})

const waterBars = computed(() =>
  rangeDaysList.value.map((d) => {
    const ml = range.value.water.get(d.date)
    return {
      key: d.date,
      label: rangeDaysList.value.length <= 7 ? formatWeekday(d.date).slice(0, 2) : String(Number(d.date.slice(8))),
      title: `${formatWeekday(d.date)}, ${formatShortDate(d.date)}`,
      segments: ml == null ? null : [{ value: ml, color: 'var(--activity)' }],
      valueText: ml == null ? 'Nothing logged' : `${formatInt(ml)} ml`,
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
