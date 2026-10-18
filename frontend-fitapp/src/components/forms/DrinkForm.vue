<template>
  <form class="grid gap-4" novalidate @submit.prevent="submit">
    <FormInput v-model="when" label="When" type="datetime-local" :error="!!whenError" :hint="whenError" />
    <fieldset>
      <legend class="mb-1.5 text-sm font-medium text-ink-2">Amount</legend>
      <div class="flex flex-wrap items-end gap-2">
        <button
          v-for="v in [150, 250, 330, 500]"
          :key="v"
          type="button"
          :aria-pressed="Number(volume) === v"
          class="rounded-lg border px-3 py-2 text-sm font-medium transition-colors duration-150"
          :class="Number(volume) === v ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-line-strong'"
          @click="volume = String(v)"
        >
          {{ v }} ml
        </button>
        <FormInput v-model="volume" class="w-32" label="Other (ml)" type="number" inputmode="numeric" :min="10" :max="5000" :error="!!volumeError" />
      </div>
      <p v-if="volumeError" role="alert" class="mt-1 text-xs text-danger">{{ volumeError }}</p>
    </fieldset>
    <FormActions :saving="saving" :error="error" :deletable="!!existing" :cancellable="cancellable" @cancel="emit('done')" @delete="remove" />
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import FormInput from '@/components/FormInput.vue'
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
