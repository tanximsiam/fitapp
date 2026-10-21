<template>
  <WizardFrame
    v-model:step="step"
    title="Activity"
    color="var(--heart-ink)"
    :total="2"
    :saving="saving"
    :error="error"
    :check="check"
    @exit="emit('exit')"
    @save="save"
  >
    <template v-if="step === 0">
      <ChoiceCards v-model="type" label="What did you do?" :options="TYPE_CHOICES" :columns="3" required large />
    </template>
    <template v-else>
      <ChoiceCards v-model="preset" label="For how long?" :options="DURATION_CHOICES" :columns="4" required />
      <div class="mt-4 grid grid-cols-2 gap-3">
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
      <FormInput v-model="when" class="mt-4" label="Started" type="datetime-local" :error="!!whenError" :hint="whenError" />
    </template>
  </WizardFrame>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import FormInput from '@/components/FormInput.vue'
import ChoiceCards from '@/components/forms/ChoiceCards.vue'
import type { Choice } from '@/components/forms/choices'
import { useEntryForm } from '@/composables/useEntryForm'
import { ACTIVITY_KINDS, estimateKcal } from '@/data/activities'
import { defaultInputFor, localInputToIso } from '@/lib/instants'
import { useJournalStore } from '@/stores/journal'
import type { ActivityType } from '@/types/journal'
import WizardFrame from './WizardFrame.vue'

const TONE = 'var(--heart)'
const TYPE_CHOICES: Choice<ActivityType>[] = ACTIVITY_KINDS.map((k) => ({ value: k.value, label: k.label, icon: k.icon, color: TONE }))
const DURATION_CHOICES: Choice<number>[] = [15, 30, 45, 60].map((m) => ({ value: m, label: `${m} min`, color: TONE }))

const props = defineProps<{ date: string }>()
const emit = defineEmits<{ exit: []; saved: [] }>()
const journal = useJournalStore()
const { saving, error, run } = useEntryForm(() => emit('saved'))

const step = ref(0)
const type = ref<ActivityType | null>(null)
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

// Fill in the estimate whenever the activity or the time changes, until the person edits it.
watch([type, minutes], () => {
  const m = Number(minutes.value)
  if (!edited.value && type.value && Number.isInteger(m) && m > 0) kcal.value = String(estimateKcal(type.value, m))
})

function check() {
  if (step.value === 0) return type.value !== null
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
    }),
  )
}
</script>
