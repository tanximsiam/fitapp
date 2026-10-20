<template>
  <form class="grid gap-4" novalidate @submit.prevent="submit">
    <ChoiceCards v-model="mealType" label="Meal" :options="MEAL_CHOICES" :columns="4" required />
    <FormInput v-model="when" label="When" type="datetime-local" :error="!!whenError" :hint="whenError" />
    <fieldset class="min-w-0">
      <legend class="mb-1 text-sm font-medium text-ink-2">Foods</legend>
      <p class="mb-3 text-xs text-muted">Pick a food from the list and FitApp estimates its nutrients from the amount. For anything else, you can type values yourself or leave them blank.</p>
      <FoodItemEditor v-for="(item, i) in items" :key="i" v-model="items[i]" class="mb-3" :error="itemErrors[i]" :removable="items.length > 1" @remove="items.splice(i, 1)" />
      <button type="button" class="text-sm font-medium text-accent underline underline-offset-2" @click="items.push(blankDraft())">Add another food</button>
    </fieldset>

    <label class="grid gap-1.5 text-sm font-medium text-ink-2">
      <span>Note <span class="font-normal text-muted">(optional, private)</span></span>
      <textarea v-model="note" rows="2" maxlength="2000" :class="TEXTAREA" />
    </label>
    <FormActions :saving="saving" :error="error" :deletable="!!existing" :cancellable="cancellable" @cancel="emit('done')" @delete="remove" />
  </form>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import FormInput from '@/components/FormInput.vue'
import FormActions from './FormActions.vue'
import FoodItemEditor from './FoodItemEditor.vue'
import { blankDraft, draftError, draftToItem, toDraft, type FoodDraft } from './foodDraft'
import ChoiceCards from './ChoiceCards.vue'
import { MEAL_CHOICES } from './choices'
import { TEXTAREA } from './styles'
import { useEntryForm } from '@/composables/useEntryForm'
import { defaultInputFor, isoToLocalInput, localInputToIso } from '@/lib/instants'
import { useJournalStore } from '@/stores/journal'
import type { Meal, MealType } from '@/types/journal'

const props = withDefaults(defineProps<{ date: string; existing?: Meal; cancellable?: boolean }>(), { existing: undefined, cancellable: true })
const emit = defineEmits<{ done: [] }>()
const journal = useJournalStore()
const { saving, error, run } = useEntryForm(() => emit('done'))

const hour = new Date().getHours()
const guessType: MealType = hour < 11 ? 'breakfast' : hour < 16 ? 'lunch' : hour < 18 ? 'snack' : 'dinner'
const when = ref(props.existing ? isoToLocalInput(props.existing.eatenAt) : defaultInputFor(props.date))
const mealType = ref<MealType>(props.existing?.mealType ?? guessType)
const items = reactive<FoodDraft[]>(props.existing ? props.existing.items.map(toDraft) : [blankDraft()])
const note = ref(props.existing?.note ?? '')
const whenError = ref<string>()
const itemErrors = ref<string[]>([])

function submit() {
  whenError.value = when.value ? undefined : 'Choose when you ate.'
  itemErrors.value = items.map(draftError)
  if (whenError.value || itemErrors.value.some(Boolean)) return
  run(() =>
    journal.saveMeal(
      {
        eatenAt: localInputToIso(when.value),
        mealType: mealType.value,
        note: note.value.trim() || null,
        items: items.map(draftToItem),
      },
      props.existing,
    ),
  )
}

const remove = () => run(() => journal.remove('meals', props.existing!.id))
</script>
