<template>
  <fieldset class="min-w-0">
    <legend class="mb-1 text-lg font-semibold tracking-tight">What did you do?</legend>
    <p class="mb-4 text-xs text-muted">One line per exercise. Start typing to pick from the list, or type your own.</p>

    <ol class="grid gap-3">
      <li v-for="(row, i) in rows" :key="row.key" class="rounded-2xl bg-page p-3">
        <div class="flex items-start gap-2">
          <!-- The exercise's icon once it is a known one; until then its number. -->
          <span class="tabular mt-2.5 grid size-6 shrink-0 place-items-center rounded-full bg-surface text-xs font-semibold text-ink-2" aria-hidden="true">
            <ion-icon v-if="exerciseIcon(row.name)" :icon="exerciseIcon(row.name)!" class="text-[13px] text-[var(--heart)]" />
            <template v-else>{{ i + 1 }}</template>
          </span>
          <ExercisePicker v-model="row.name" :label="`Exercise ${i + 1}`" :invalid="!!errors[i]?.name" />
          <button v-if="rows.length > 1" type="button" class="mt-1 grid size-9 shrink-0 place-items-center rounded-full text-muted hover:text-danger" :aria-label="`Remove exercise ${i + 1}`" @click="rows.splice(i, 1)">
            <ion-icon :icon="closeOutline" aria-hidden="true" class="text-lg" />
          </button>
        </div>
        <div class="mt-2 grid grid-cols-3 gap-2 pl-8">
          <label v-for="f in FIELDS" :key="f.key" class="grid gap-1 text-[11px] font-medium text-muted">
            {{ f.label }}
            <input
              v-model="row[f.key]"
              type="number"
              inputmode="numeric"
              :min="1"
              :max="f.max"
              :placeholder="f.key === 'minutes' ? String(Number(row.sets || 1) * MINUTES_PER_SET) : ''"
              class="tabular min-h-10 w-full rounded-lg border bg-surface px-2.5 text-[15px] text-ink placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              :class="errors[i]?.[f.key] ? 'border-danger' : 'border-line-strong'"
            />
          </label>
        </div>
        <p v-if="errors[i]?.message" role="alert" class="mt-2 pl-8 text-xs text-danger">{{ errors[i]!.message }}</p>
      </li>
    </ol>

    <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
      <button type="button" class="inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-sm font-medium text-ink-2 ring-1 ring-line-strong hover:text-ink" @click="addRow">
        <ion-icon :icon="addOutline" aria-hidden="true" />Add exercise
      </button>
      <p v-if="summary" class="tabular text-sm" aria-live="polite">
        <span class="text-muted">About </span><span class="font-semibold">{{ summary.minutes }} min · {{ summary.kcal }} kcal</span>
      </p>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { addOutline, closeOutline } from 'ionicons/icons'
import { estimateWorkoutKcal, workoutMinutes } from '@/data/activities'
import { exerciseIcon, MINUTES_PER_SET } from '@/data/exercises'
import ExercisePicker from './ExercisePicker.vue'
import type { WorkoutExercise } from '@/types/journal'

export interface SetRow {
  key: number
  name: string
  sets: string | number
  reps: string | number
  minutes: string | number
}

const FIELDS = [
  { key: 'sets', label: 'Sets', max: 50 },
  { key: 'reps', label: 'Reps', max: 1000 },
  { key: 'minutes', label: 'Minutes', max: 600 },
] as const

const rows = defineModel<SetRow[]>({ required: true })
defineProps<{ errors: ({ name?: boolean; sets?: boolean; reps?: boolean; minutes?: boolean; message?: string } | undefined)[] }>()

let nextKey = 1000
function addRow() {
  rows.value.push({ key: nextKey++, name: '', sets: '3', reps: '', minutes: '' })
}

/** Rows that are complete enough to count, as exercises. */
const summary = computed(() => {
  const done = toExercises(rows.value).filter((x): x is WorkoutExercise => x !== null)
  return done.length ? { minutes: workoutMinutes(done), kcal: estimateWorkoutKcal(done) } : null
})
</script>

<script lang="ts">
import type { WorkoutExercise as Exercise } from '@/types/journal'

// Number inputs bound with v-model hand back numbers, empty ones strings.
const whole = (v: string | number) => (String(v).trim() === '' ? null : Number(v))

/** A draft row as an exercise, or null when it has no name or no valid set count. */
export function toExercises(rows: { name: string; sets: string | number; reps: string | number; minutes: string | number }[]): (Exercise | null)[] {
  return rows.map((r) => {
    const sets = whole(r.sets)
    if (!r.name.trim() || sets === null || !Number.isInteger(sets) || sets < 1) return null
    return { name: r.name.trim(), sets, reps: whole(r.reps), durationMin: whole(r.minutes) }
  })
}
</script>
