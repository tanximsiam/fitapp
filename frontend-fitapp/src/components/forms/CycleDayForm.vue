<template>
  <form class="grid gap-4" novalidate @submit.prevent="submit">
    <FormInput v-model="date" label="Date" type="date" :error="!!dateError" :hint="dateError" />
    <ChoiceCards v-model="flow" label="Bleeding" :options="FLOW_CHOICES" required />
    <ChipToggles v-model="symptoms" :options="SYMPTOMS" label="Symptoms" />
    <label class="grid gap-1.5 text-sm font-medium text-ink-2">
      <span>Note <span class="font-normal text-muted">(optional, private)</span></span>
      <textarea v-model="note" rows="2" maxlength="2000" :class="TEXTAREA" />
    </label>
    <p v-if="emptyError" role="alert" class="text-sm text-danger">{{ emptyError }}</p>
    <FormActions :saving="saving" :error="error" :deletable="!!existing" :cancellable="cancellable" @cancel="emit('done')" @delete="remove" />
  </form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import FormInput from '@/components/FormInput.vue'
import ChipToggles from './ChipToggles.vue'
import ChoiceCards from './ChoiceCards.vue'
import { FLOW_CHOICES } from './choices'
import FormActions from './FormActions.vue'
import { TEXTAREA } from './styles'
import { useEntryForm } from '@/composables/useEntryForm'
import { useFitnessStore } from '@/stores/fitness'
import { useJournalStore } from '@/stores/journal'
import { SYMPTOMS, type Flow, type Symptom } from '@/types/journal'

const props = withDefaults(defineProps<{ date: string; cancellable?: boolean }>(), { cancellable: true })
const emit = defineEmits<{ done: [] }>()
const journal = useJournalStore()
const today = useFitnessStore().today
const { saving, error, run } = useEntryForm(() => emit('done'))

const date = ref(props.date)
const existing = computed(() => journal.onDate(date.value).cycleDay ?? undefined)
const flow = ref<Flow | null>(existing.value?.flow ?? null)
const symptoms = ref<Symptom[]>([...(existing.value?.symptoms ?? [])])
const note = ref(existing.value?.note ?? '')
const dateError = ref<string>()
const emptyError = ref<string>()

function submit() {
  dateError.value = date.value && date.value <= today ? undefined : 'Choose a date up to today.'
  emptyError.value = flow.value || symptoms.value.length || note.value.trim() ? undefined : 'Record bleeding, a symptom or a note.'
  if (dateError.value || emptyError.value) return
  run(() => journal.saveCycleDay(date.value, { flow: flow.value, symptoms: symptoms.value, note: note.value.trim() || null }, existing.value))
}

const remove = () => run(() => journal.removeCycleDay(date.value))
</script>
