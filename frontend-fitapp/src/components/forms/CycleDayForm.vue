<template>
  <form class="grid gap-4" novalidate @submit.prevent="submit">
    <FormInput v-model="date" label="Date" type="date" :error="!!dateError" :hint="dateError" />
    <fieldset>
      <legend class="mb-1.5 text-sm font-medium text-ink-2">Bleeding</legend>
      <div class="flex flex-wrap gap-1.5">
        <label
          v-for="opt in FLOW_OPTIONS"
          :key="opt.label"
          class="cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--focus)]"
          :class="flow === opt.value ? 'border-accent bg-accent-soft font-medium' : 'border-line bg-surface hover:border-line-strong'"
        >
          <input v-model="flow" type="radio" name="flow" :value="opt.value" class="sr-only" />{{ opt.label }}
        </label>
      </div>
    </fieldset>
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
import FormActions from './FormActions.vue'
import { TEXTAREA } from './styles'
import { useEntryForm } from '@/composables/useEntryForm'
import { useFitnessStore } from '@/stores/fitness'
import { useJournalStore } from '@/stores/journal'
import { SYMPTOMS, type Flow, type Symptom } from '@/types/journal'

const FLOW_OPTIONS: { value: Flow | null; label: string }[] = [
  { value: null, label: 'None' },
  { value: 'spotting', label: 'Spotting' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
]

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
