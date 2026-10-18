<template>
  <form class="grid gap-4" novalidate @submit.prevent="submit">
    <FormInput v-model="when" label="When" type="datetime-local" :error="!!whenError" :hint="whenError" />
    <ScalePicker v-model="mood" label="Mood" :labels="['Very low', 'Low', 'Okay', 'Good', 'Great']" required />
    <p v-if="moodError" role="alert" class="-mt-2 text-xs text-danger">{{ moodError }}</p>
    <ScalePicker v-model="energy" label="Energy" :labels="['Drained', 'Low', 'Steady', 'Good', 'High']" />
    <ScalePicker v-model="stress" label="Stress you felt" :labels="['None', 'Mild', 'Some', 'High', 'Very high']" />
    <p class="-mt-2 text-xs text-muted">Self-reported. Kept separate from any stress value a watch might estimate.</p>
    <ChipToggles v-model="emotions" :options="EMOTIONS" label="Emotions" />
    <label class="grid gap-1.5 text-sm font-medium text-ink-2">
      <span>Note <span class="font-normal text-muted">(optional, private)</span></span>
      <textarea v-model="note" rows="3" maxlength="2000" :class="TEXTAREA" />
    </label>
    <FormActions :saving="saving" :error="error" :deletable="!!existing" :cancellable="cancellable" @cancel="emit('done')" @delete="remove" />
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import FormInput from '@/components/FormInput.vue'
import ChipToggles from './ChipToggles.vue'
import FormActions from './FormActions.vue'
import ScalePicker from './ScalePicker.vue'
import { TEXTAREA } from './styles'
import { useEntryForm } from '@/composables/useEntryForm'
import { defaultInputFor, isoToLocalInput, localInputToIso } from '@/lib/instants'
import { useJournalStore } from '@/stores/journal'
import type { MoodEntry } from '@/types/journal'

const EMOTIONS = ['calm', 'content', 'focused', 'grateful', 'energised', 'tired', 'stressed', 'irritable', 'anxious', 'low'] as const

const props = withDefaults(defineProps<{ date: string; existing?: MoodEntry; cancellable?: boolean }>(), { existing: undefined, cancellable: true })
const emit = defineEmits<{ done: [] }>()
const journal = useJournalStore()
const { saving, error, run } = useEntryForm(() => emit('done'))

const when = ref(props.existing ? isoToLocalInput(props.existing.recordedAt) : defaultInputFor(props.date))
const mood = ref<number | null>(props.existing?.mood ?? null)
const energy = ref<number | null>(props.existing?.energy ?? null)
const stress = ref<number | null>(props.existing?.stress ?? null)
const emotions = ref<string[]>([...(props.existing?.emotions ?? [])])
const note = ref(props.existing?.note ?? '')
const whenError = ref<string>()
const moodError = ref<string>()
watch(mood, () => (moodError.value = undefined))

function submit() {
  whenError.value = when.value ? undefined : 'Choose when this was.'
  moodError.value = mood.value ? undefined : 'Choose how your mood was.'
  if (whenError.value || moodError.value) return
  run(() =>
    journal.saveMood(
      { recordedAt: localInputToIso(when.value), mood: mood.value!, energy: energy.value, stress: stress.value, emotions: emotions.value, note: note.value.trim() || null },
      props.existing,
    ),
  )
}

const remove = () => run(() => journal.remove('mood', props.existing!.id))
</script>
