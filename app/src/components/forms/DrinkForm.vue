<template>
  <form class="grid gap-4" novalidate @submit.prevent="submit">
    <FormInput v-model="when" label="When" type="datetime-local" :error="!!whenError" :hint="whenError" />
    <ChoiceCards v-model="preset" label="Amount" :options="DRINK_CHOICES" required />
    <FormInput v-model="volume" class="w-40" label="Or another amount (ml)" type="number" inputmode="numeric" :min="10" :max="5000" :error="!!volumeError" :hint="volumeError" />
    <FormActions :saving="saving" :error="error" :deletable="!!existing" :cancellable="cancellable" @cancel="emit('done')" @delete="remove" />
  </form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import FormInput from '@/components/FormInput.vue'
import ChoiceCards from './ChoiceCards.vue'
import { DRINK_CHOICES } from './choices'
import FormActions from './FormActions.vue'
import { useEntryForm } from '@/composables/useEntryForm'
import { defaultInputFor, isoToLocalInput, localInputToIso } from '@/lib/instants'
import { useJournalStore } from '@/stores/journal'
import type { HydrationEntry } from '@/types/journal'

const props = withDefaults(defineProps<{ date: string; existing?: HydrationEntry; cancellable?: boolean }>(), { existing: undefined, cancellable: true })
const emit = defineEmits<{ done: [] }>()
const journal = useJournalStore()
const { saving, error, run } = useEntryForm(() => emit('done'))

const when = ref(props.existing ? isoToLocalInput(props.existing.recordedAt) : defaultInputFor(props.date))
const volume = ref(String(props.existing?.volumeMl ?? 250))
const preset = computed({
  get: () => DRINK_CHOICES.find((c) => c.value === Number(volume.value))?.value ?? null,
  set: (v) => (volume.value = v == null ? '' : String(v)),
})
const whenError = ref<string>()
const volumeError = ref<string>()

function submit() {
  const ml = Number(volume.value)
  whenError.value = when.value ? undefined : 'Choose when you drank.'
  volumeError.value = Number.isInteger(ml) && ml >= 10 && ml <= 5000 ? undefined : 'Enter a whole number from 10 to 5000 ml.'
  if (whenError.value || volumeError.value) return
  run(() => journal.saveHydration({ recordedAt: localInputToIso(when.value), volumeMl: ml }, props.existing))
}

const remove = () => run(() => journal.remove('hydration', props.existing!.id))
</script>
