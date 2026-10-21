<template>
  <WizardFrame
    v-model:step="step"
    title="Drink"
    color="var(--activity-ink)"
    :total="2"
    :saving="saving"
    :error="error"
    :check="check"
    @exit="emit('exit')"
    @save="save"
  >
    <template v-if="step === 0">
      <ChoiceCards v-model="preset" label="How much did you drink?" :options="DRINK_CHOICES" :columns="4" required large @pick="advance" />
      <FormInput v-model="volume" class="max-w-48" label="Or another amount (ml)" type="number" inputmode="numeric" :min="10" :max="5000" :error="!!volumeError" :hint="volumeError" />
    </template>
    <template v-else>
      <Summary :rows="[['Water', `${volume} ml`]]" />
      <FormInput v-model="when" label="When?" type="datetime-local" :error="!!whenError" :hint="whenError" />
    </template>
  </WizardFrame>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import FormInput from '@/components/FormInput.vue'
import ChoiceCards from '@/components/forms/ChoiceCards.vue'
import { DRINK_CHOICES } from '@/components/forms/choices'
import { useEntryForm } from '@/composables/useEntryForm'
import { defaultInputFor, localInputToIso } from '@/lib/instants'
import { useJournalStore } from '@/stores/journal'
import Summary from './StepSummary.vue'
import WizardFrame from './WizardFrame.vue'

const props = defineProps<{ date: string }>()
const emit = defineEmits<{ exit: []; saved: [] }>()
const journal = useJournalStore()
const { saving, error, run } = useEntryForm(() => emit('saved'))

const step = ref(0)
// After a pick: a short pause so the selection is seen, then the next step.
const advance = () => setTimeout(() => step.value++, 180)
const volume = ref('250')
const when = ref(defaultInputFor(props.date))
const volumeError = ref<string>()
const whenError = ref<string>()
const preset = computed({
  get: () => DRINK_CHOICES.find((c) => c.value === Number(volume.value))?.value ?? null,
  set: (v) => (volume.value = v == null ? '' : String(v)),
})

function check() {
  const ml = Number(volume.value)
  volumeError.value = Number.isInteger(ml) && ml >= 10 && ml <= 5000 ? undefined : 'Enter a whole number from 10 to 5000 ml.'
  return !volumeError.value
}

function save() {
  whenError.value = when.value ? undefined : 'Choose when you drank.'
  if (whenError.value || !check()) return
  run(() => journal.saveHydration({ recordedAt: localInputToIso(when.value), volumeMl: Number(volume.value) }))
}
</script>
