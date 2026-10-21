<template>
  <WizardFrame
    v-model:step="step"
    title="Mood check-in"
    color="var(--mood-ink)"
    :total="5"
    :saving="saving"
    :error="error"
    :blocked="step === 0 && mood === null"
    :skippable="(step === 1 && energy === null) || (step === 2 && stress === null) || (step === 3 && !emotions.length && !note.trim())"
    :hide-next="step <= 2"
    @exit="emit('exit')"
    @save="save"
  >
    <ChoiceCards v-if="step === 0" v-model="mood" label="How are you feeling?" :options="MOOD_CHOICES" required large @pick="advance" />
    <ChoiceCards v-else-if="step === 1" v-model="energy" label="How is your energy?" :options="ENERGY_CHOICES" large @pick="advance" />
    <template v-else-if="step === 2">
      <ChoiceCards v-model="stress" label="How stressed do you feel?" :options="STRESS_CHOICES" large @pick="advance" />
      <p class="-mt-2 text-xs text-muted">Your own rating. It's kept separate from the stress estimate a watch makes.</p>
    </template>
    <template v-else-if="step === 3">
      <ChipToggles v-model="emotions" :options="EMOTIONS" label="Any of these fit?" />
      <label class="grid gap-1.5 text-sm font-medium text-ink-2">
        <span>Note <span class="font-normal text-muted">(optional, private)</span></span>
        <textarea v-model="note" rows="3" maxlength="2000" :class="TEXTAREA" placeholder="What happened today?" />
      </label>
    </template>
    <template v-else>
      <Summary :rows="summary" />
      <FormInput v-model="when" label="When" type="datetime-local" :error="!!whenError" :hint="whenError" />
    </template>
  </WizardFrame>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import FormInput from '@/components/FormInput.vue'
import ChipToggles from '@/components/forms/ChipToggles.vue'
import ChoiceCards from '@/components/forms/ChoiceCards.vue'
import { ENERGY_CHOICES, MOOD_CHOICES, STRESS_CHOICES } from '@/components/forms/choices'
import { TEXTAREA } from '@/components/forms/styles'
import { useEntryForm } from '@/composables/useEntryForm'
import { defaultInputFor, localInputToIso } from '@/lib/instants'
import { useJournalStore } from '@/stores/journal'
import Summary from './StepSummary.vue'
import WizardFrame from './WizardFrame.vue'

const EMOTIONS = ['calm', 'content', 'focused', 'grateful', 'energised', 'tired', 'stressed', 'irritable', 'anxious', 'low'] as const

const props = defineProps<{ date: string }>()
const emit = defineEmits<{ exit: []; saved: [] }>()
const journal = useJournalStore()
const { saving, error, run } = useEntryForm(() => emit('saved'))

const step = ref(0)
// After a pick: a short pause so the selection is seen, then the next step.
const advance = () => setTimeout(() => step.value++, 180)
const mood = ref<number | null>(null)
const energy = ref<number | null>(null)
const stress = ref<number | null>(null)
const emotions = ref<string[]>([])
const note = ref('')
const when = ref(defaultInputFor(props.date))
const whenError = ref<string>()

const label = (opts: { value: number; label: string }[], v: number | null) => opts.find((o) => o.value === v)?.label ?? 'Skipped'
const summary = computed(() => [
  ['Mood', label(MOOD_CHOICES, mood.value)],
  ['Energy', label(ENERGY_CHOICES, energy.value)],
  ['Stress', label(STRESS_CHOICES, stress.value)],
  ['Emotions', emotions.value.join(', ') || 'None'],
])

function save() {
  whenError.value = when.value ? undefined : 'Choose when this was.'
  if (whenError.value || mood.value === null) return
  run(() =>
    journal.saveMood({
      recordedAt: localInputToIso(when.value),
      mood: mood.value!,
      energy: energy.value,
      stress: stress.value,
      emotions: emotions.value,
      note: note.value.trim() || null,
    }),
  )
}
</script>
