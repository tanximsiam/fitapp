<template>
  <section class="card flex flex-col p-4 sm:p-5" aria-labelledby="journal-title">
    <div class="flex items-baseline justify-between gap-3">
      <h2 id="journal-title" class="text-[15px] font-semibold tracking-tight">Journal</h2>
      <RouterLink to="/timeline" class="text-xs text-muted underline-offset-2 hover:text-ink hover:underline">Timeline</RouterLink>
    </div>
    <p class="mt-0.5 text-xs text-muted">{{ fitness.isToday ? 'What you logged today' : 'What you logged this day' }}</p>

    <ul class="mt-4 grid gap-1">
      <li v-for="r in rows" :key="r.kind" class="flex items-center gap-3 rounded-xl py-2 pr-1 pl-2 transition-colors duration-150 hover:bg-page" :class="`tone-${r.tone}`">
        <RouterLink :to="r.to" class="flex min-w-0 flex-1 items-center gap-3">
          <span class="badge grid size-9 shrink-0 place-items-center rounded-lg" aria-hidden="true"><ion-icon :icon="r.icon" class="text-lg" /></span>
          <span class="min-w-0">
            <span class="block text-sm font-medium">{{ r.label }}</span>
            <span class="tabular block truncate text-xs" :class="r.empty ? 'text-muted' : 'text-ink-2'">{{ r.value }}</span>
          </span>
        </RouterLink>
        <button
          v-if="fitness.isToday"
          type="button"
          class="grid size-8 shrink-0 place-items-center rounded-full text-ink-2 ring-1 ring-line transition-[background-color,color,scale] duration-150 ease-out hover:bg-surface hover:text-ink active:scale-[0.94]"
          :aria-label="r.action"
          @click="ui.openQuickLog(r.kind)"
        >
          <ion-icon :icon="add" aria-hidden="true" />
        </button>
      </li>
    </ul>

    <div v-if="latest.length" class="mt-5">
      <h3 class="mb-2 text-xs font-medium text-muted">Latest entries</h3>
      <ul class="grid grid-cols-[minmax(0,1fr)] gap-2">
        <li v-for="e in latest" :key="e.key" class="flex min-w-0 items-center gap-2.5 text-sm" :class="`tone-${e.tone}`">
          <span class="dot size-2 shrink-0 rounded-full" aria-hidden="true" />
          <span class="min-w-0 flex-1 truncate">{{ e.text }}</span>
          <span class="tabular shrink-0 text-xs text-muted">{{ e.when }}</span>
        </li>
      </ul>
    </div>

    <div v-if="journal.prefs.mood" class="mt-auto pt-5">
      <h3 class="mb-2 text-xs font-medium text-muted">Mood this week</h3>
      <ol class="grid grid-cols-7 gap-1 text-center" :aria-label="weekLabel">
        <li v-for="w in week" :key="w.date" class="flex flex-col items-center gap-1">
          <ChoiceGlyph v-if="w.level" kind="face" :level="w.level" :color="MOOD_CHOICES[w.level - 1].color" class="size-7" still />
          <span v-else class="size-7 rounded-full border border-dashed border-line-strong" aria-hidden="true" />
          <span class="text-[11px]" :class="w.date === fitness.selectedDate ? 'font-semibold text-ink' : 'text-muted'" aria-hidden="true">{{ w.day }}</span>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { add } from 'ionicons/icons'
import { ICONS } from '@/components/metricIcons'
import type { Tone } from '@/components/PanelSection.vue'
import ChoiceGlyph from '@/components/forms/ChoiceGlyph.vue'
import { MOOD_CHOICES } from '@/components/forms/choices'
import { addDays } from '@/lib/dates'
import { mean } from '@/data/derive'
import { MOOD_LABELS } from '@/data/journalDerive'
import { formatClock, formatInt, formatWeekday } from '@/lib/format'
import { useFitnessStore } from '@/stores/fitness'
import { useJournalStore } from '@/stores/journal'
import { useUiStore, type LogKind } from '@/stores/ui'

const fitness = useFitnessStore()
const journal = useJournalStore()
const ui = useUiStore()
const day = computed(() => journal.onDate(fitness.selectedDate))

/** Average mood per day for the seven days ending on the selected day. */
const week = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const date = addDays(fitness.selectedDate, i - 6)
    const m = mean(journal.onDate(date).mood.map((e) => e.mood))
    return { date, day: formatWeekday(date).slice(0, 2), level: m == null ? null : Math.round(m) }
  }),
)
const weekLabel = computed(
  () => `Mood this week: ${week.value.map((w) => `${w.day} ${w.level ? MOOD_LABELS[w.level - 1] : 'not logged'}`).join(', ')}`,
)

/** The three most recent entries up to the end of the selected day. */
const latest = computed(() => {
  const end = fitness.selectedDate
  const d = journal.data
  const all = [
    ...(journal.prefs.mood ? d.mood.map((e) => ({ key: `m${e.id}`, at: e.recordedAt, date: e.date, tone: 'mood' as Tone, text: `Mood: ${MOOD_LABELS[e.mood - 1]}` })) : []),
    ...(journal.prefs.food
      ? d.meals.map((e) => ({ key: `f${e.id}`, at: e.eatenAt, date: e.date, tone: 'energy' as Tone, text: `${e.mealType[0].toUpperCase()}${e.mealType.slice(1)}: ${e.items.map((i) => i.name).join(', ')}` }))
      : []),
    ...(journal.prefs.food ? d.hydration.map((e) => ({ key: `h${e.id}`, at: e.recordedAt, date: e.date, tone: 'activity' as Tone, text: `Water ${formatInt(e.volumeMl)} ml` })) : []),
  ]
  return all
    .filter((e) => e.date <= end)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, 3)
    .map((e) => ({ ...e, when: e.date === end ? formatClock(e.at) : formatWeekday(e.date) }))
})

type Row = { kind: LogKind; label: string; action: string; icon: string; tone: Tone; to: string; value: string; empty: boolean; on: boolean }

const rows = computed(() => {
  const d = day.value
  const m = mean(d.mood.map((e) => e.mood))
  const kcal = d.meals.flatMap((x) => x.items).reduce((a, i) => a + (i.energyKcal ?? 0), 0)
  const water = d.hydration.reduce((a, h) => a + h.volumeMl, 0)
  const c = d.cycleDay
  const all: Row[] = [
    {
      kind: 'mood', label: 'Mood', action: 'Log mood', icon: ICONS.mood, tone: 'mood', to: '/mood', on: journal.prefs.mood,
      value: m == null ? 'Not logged yet' : `${MOOD_LABELS[Math.round(m) - 1]} · ${d.mood.length} check-in${d.mood.length > 1 ? 's' : ''}`,
      empty: m == null,
    },
    {
      kind: 'meal', label: 'Meals', action: 'Log a meal', icon: ICONS.meals, tone: 'energy', to: '/food', on: journal.prefs.food,
      value: d.meals.length ? `${d.meals.length} meal${d.meals.length > 1 ? 's' : ''}${kcal ? ` · ${formatInt(kcal)} kcal` : ''}` : 'Not logged yet',
      empty: !d.meals.length,
    },
    {
      kind: 'drink', label: 'Water', action: 'Log a drink', icon: ICONS.water, tone: 'activity', to: '/food', on: journal.prefs.food,
      value: water ? `${formatInt(water)} ml` : 'Not logged yet',
      empty: !water,
    },
    {
      kind: 'cycle', label: 'Periods', action: 'Log a period day', icon: ICONS.cycle, tone: 'spo2', to: '/cycle', on: journal.prefs.cycle,
      value: c ? [c.flow && `${c.flow} flow`, c.symptoms.length ? `${c.symptoms.length} symptoms` : null].filter(Boolean).join(' · ') || 'Note only' : 'Nothing logged',
      empty: !c,
    },
  ]
  return all.filter((r) => r.on)
})
</script>

<style scoped>
.badge {
  background: var(--tone-soft);
  color: var(--tone);
}
.dot {
  background: var(--tone);
}
</style>
