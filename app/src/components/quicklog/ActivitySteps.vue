<template>
  <WizardFrame
    v-model:step="step"
    title="Activity"
    color="var(--heart-ink)"
    :total="isWorkout ? 3 : 2"
    :saving="saving"
    :error="error"
    :check="check"
    :hide-next="step === 0"
    @exit="emit('exit')"
    @save="save"
  >
    <!-- Picking an activity moves on by itself. -->
    <ChoiceCards v-if="step === 0" v-model="type" label="What did you do?" :options="TYPE_CHOICES" :columns="3" required large @pick="pick" />

    <WorkoutSets v-else-if="isWorkout && step === 1" v-model="rows" :errors="rowErrors" />

    <template v-else>
      <template v-if="!isWorkout">
        <ChoiceCards v-model="preset" label="For how long?" :options="DURATION_CHOICES" :columns="4" required />
      </template>
      <p v-else class="text-sm text-ink-2">
        <span class="font-semibold text-ink">{{ exercises.length }} exercise{{ exercises.length === 1 ? '' : 's' }}</span> · {{ exercises.map((x) => x.name).join(', ') }}
      </p>
      <div class="grid grid-cols-2 items-end gap-3">
        <FormInput v-model="minutes" label="Minutes" type="number" inputmode="numeric" :min="1" :max="1440" :error="!!minutesError" :hint="minutesError" />
        <FormInput
          v-model="kcal"
          label="Energy (kcal)"
          type="number"
          inputmode="numeric"
          :min="0"
          :max="5000"
          :error="!!kcalError"
          :hint="kcalError ?? (edited ? 'Your value' : 'Estimated, change it if you know')"
          @update:model-value="edited = true"
        />
      </div>
      <FormInput v-model="when" label="Started" type="datetime-local" :error="!!whenError" :hint="whenError" />
    </template>
  </WizardFrame>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import FormInput from '@/components/FormInput.vue'
import ChoiceCards from '@/components/forms/ChoiceCards.vue'
import type { Choice } from '@/components/forms/choices'
import { useEntryForm } from '@/composables/useEntryForm'
import { ACTIVITY_KINDS, estimateKcal, estimateWorkoutKcal, workoutMinutes } from '@/data/activities'
import { defaultInputFor, localInputToIso } from '@/lib/instants'
import { useJournalStore } from '@/stores/journal'
import type { ActivityType, WorkoutExercise } from '@/types/journal'
import WizardFrame from './WizardFrame.vue'
import WorkoutSets, { toExercises, type SetRow } from './WorkoutSets.vue'

const TONE = 'var(--heart)'
const TYPE_CHOICES: Choice<ActivityType>[] = ACTIVITY_KINDS.map((k) => ({ value: k.value, label: k.label, icon: k.icon, color: TONE }))
const DURATION_CHOICES: Choice<number>[] = [15, 30, 45, 60].map((m) => ({ value: m, label: `${m} min`, color: TONE }))

const props = defineProps<{ date: string }>()
const emit = defineEmits<{ exit: []; saved: [] }>()
const journal = useJournalStore()
const { saving, error, run } = useEntryForm(() => emit('saved'))

const step = ref(0)
const type = ref<ActivityType | null>(null)
const isWorkout = computed(() => type.value === 'workout')
const rows = ref<SetRow[]>([{ key: 1, name: '', sets: '3', reps: '', minutes: '' }])
const rowErrors = ref<({ name?: boolean; sets?: boolean; reps?: boolean; minutes?: boolean; message?: string } | undefined)[]>([])
const exercises = computed(() => toExercises(rows.value).filter((x): x is WorkoutExercise => x !== null))

const minutes = ref('30')
const kcal = ref('')
/** Once the person types an energy value, it is theirs: no more automatic estimates. */
const edited = ref(false)
const when = ref(defaultInputFor(props.date))
const minutesError = ref<string>()
const kcalError = ref<string>()
const whenError = ref<string>()

const preset = computed({
  get: () => DURATION_CHOICES.find((c) => c.value === Number(minutes.value))?.value ?? null,
  set: (v) => (minutes.value = v == null ? '' : String(v)),
})

function pick() {
  // A short pause so the selection is seen before the next step slides in.
  setTimeout(() => step.value++, 180)
}

// Keep the estimate current until the person edits it.
watch([type, minutes], () => {
  const m = Number(minutes.value)
  if (edited.value || !type.value || !Number.isInteger(m) || m <= 0) return
  kcal.value = String(isWorkout.value ? Math.round((estimateWorkoutKcal(exercises.value) * m) / Math.max(1, workoutMinutes(exercises.value))) : estimateKcal(type.value, m))
})

const filled = (v: string | number) => String(v).trim() !== ''
const whole = (v: string | number) => filled(v) && Number.isInteger(Number(v))

function checkRows() {
  rowErrors.value = rows.value.map((r) => {
    const blank = !r.name.trim() && !filled(r.reps) && !filled(r.minutes)
    if (blank && rows.value.length > 1) return undefined
    const e = {
      name: !r.name.trim(),
      sets: !whole(r.sets) || Number(r.sets) < 1 || Number(r.sets) > 50,
      reps: filled(r.reps) && (!whole(r.reps) || Number(r.reps) < 1 || Number(r.reps) > 1000),
      minutes: filled(r.minutes) && (!whole(r.minutes) || Number(r.minutes) < 1 || Number(r.minutes) > 600),
    }
    return Object.values(e).some(Boolean) ? { ...e, message: e.name ? 'Name the exercise.' : 'Check the numbers.' } : undefined
  })
  return rowErrors.value.every((e) => !e) && exercises.value.length > 0
}

function check() {
  if (step.value === 0) return type.value !== null
  if (isWorkout.value && step.value === 1) {
    if (!checkRows()) return false
    // Moving on from the list: fill in its time and energy.
    minutes.value = String(Math.max(1, workoutMinutes(exercises.value)))
    if (!edited.value) kcal.value = String(estimateWorkoutKcal(exercises.value))
    return true
  }
  const m = Number(minutes.value)
  minutesError.value = Number.isInteger(m) && m >= 1 && m <= 1440 ? undefined : 'Enter whole minutes, 1 to 1440.'
  const k = kcal.value === '' ? null : Number(kcal.value)
  kcalError.value = k === null || (Number.isInteger(k) && k >= 0 && k <= 5000) ? undefined : 'Enter a whole number up to 5000.'
  return !minutesError.value && !kcalError.value
}

function save() {
  whenError.value = when.value ? undefined : 'Choose when you started.'
  if (whenError.value || !check() || !type.value) return
  const energy = kcal.value === '' ? null : Number(kcal.value)
  run(() =>
    journal.saveActivity({
      startedAt: localInputToIso(when.value),
      activityType: type.value!,
      durationMin: Number(minutes.value),
      energyKcal: energy,
      energySource: energy === null ? null : edited.value ? 'entered' : 'estimated',
      exercises: isWorkout.value ? exercises.value : [],
    }),
  )
}
</script>
