<template>
  <WizardFrame
    v-model:step="step"
    title="Period"
    color="var(--mood-ink)"
    :total="3"
    :saving="saving"
    :error="error"
    :skippable="step === 1 && !symptoms.length"
    @exit="emit('exit')"
    @save="save"
  >
    <ChoiceCards v-if="step === 0" v-model="flow" label="Any bleeding today?" :options="FLOW_CHOICES" required large />
    <ChipToggles v-else-if="step === 1" v-model="symptoms" :options="SYMPTOMS" label="Any symptoms?" />
    <template v-else>
      <FormInput v-model="date" label="Date" type="date" :error="!!dateError" :hint="dateError" />
      <label class="grid gap-1.5 text-sm font-medium text-ink-2">
        <span>Note <span class="font-normal text-muted">(optional, private)</span></span>
        <textarea v-model="note" rows="3" maxlength="2000" :class="TEXTAREA" />
      </label>
      <p v-if="existing" class="text-xs text-muted">This updates the entry you already have for that date.</p>
      <p v-if="emptyError" role="alert" class="text-sm text-danger">{{ emptyError }}</p>
    </template>
  </WizardFrame>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import FormInput from '@/components/FormInput.vue'
import ChipToggles from '@/components/forms/ChipToggles.vue'
import ChoiceCards from '@/components/forms/ChoiceCards.vue'
import { FLOW_CHOICES } from '@/components/forms/choices'
import { TEXTAREA } from '@/components/forms/styles'
import { useEntryForm } from '@/composables/useEntryForm'
import { useJournalStore } from '@/stores/journal'
import { SYMPTOMS, type Flow, type Symptom } from '@/types/journal'
import WizardFrame from './WizardFrame.vue'

const props = defineProps<{ date: string }>()
const emit = defineEmits<{ exit: []; saved: [] }>()
const journal = useJournalStore()
const { saving, error, run } = useEntryForm(() => emit('saved'))

const step = ref(0)
const date = ref(props.date)
const existing = computed(() => journal.onDate(date.value).cycleDay ?? undefined)
const flow = ref<Flow | null>(existing.value?.flow ?? null)
const symptoms = ref<Symptom[]>([...(existing.value?.symptoms ?? [])])
const note = ref(existing.value?.note ?? '')
const dateError = ref<string>()
const emptyError = ref<string>()

function save() {
  dateError.value = date.value && date.value <= props.date ? undefined : 'Choose a date up to today.'
  emptyError.value = flow.value || symptoms.value.length || note.value.trim() ? undefined : 'Record bleeding, a symptom or a note.'
  if (dateError.value || emptyError.value) return
  run(() => journal.saveCycleDay(date.value, { flow: flow.value, symptoms: symptoms.value, note: note.value.trim() || null }, existing.value))
}
</script>
