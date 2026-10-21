<template>
  <WizardFrame
    v-model:step="step"
    title="Meal"
    color="var(--energy-ink)"
    :total="3"
    :saving="saving"
    :error="error"
    :blocked="step === 0 && mealType === null"
    :check="check"
    @exit="emit('exit')"
    @save="save"
  >
    <ChoiceCards v-if="step === 0" v-model="mealType" label="Which meal is this?" :options="MEAL_CHOICES" :columns="2" required large />
    <fieldset v-else-if="step === 1" class="min-w-0">
      <legend class="mb-1 text-lg font-semibold tracking-tight">What did you eat?</legend>
      <p class="mb-4 text-xs text-muted">Search the food list, then set the amount. Nutrients are estimated for you.</p>
      <FoodItemEditor v-for="(item, i) in items" :key="i" v-model="items[i]" class="mb-2" :error="itemErrors[i]" :removable="items.length > 1" @remove="items.splice(i, 1)" />
      <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
        <button type="button" class="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-ink-2 ring-1 ring-line-strong hover:text-ink" @click="items.push(blankDraft())">
          <ion-icon :icon="addOutline" aria-hidden="true" />Add food
        </button>
        <p v-if="total && items.length > 1" class="tabular text-sm" aria-live="polite">
          <span class="text-muted">Meal total </span><span class="font-semibold">{{ total.kcal }} kcal</span>
          <span class="text-muted"> · P {{ total.p }} g · C {{ total.c }} g · F {{ total.f }} g</span>
        </p>
      </div>
    </fieldset>
    <template v-else>
      <FormInput v-model="when" label="When did you eat?" type="datetime-local" :error="!!whenError" :hint="whenError" />
      <label class="grid gap-1.5 text-sm font-medium text-ink-2">
        <span>Note <span class="font-normal text-muted">(optional, private)</span></span>
        <textarea v-model="note" rows="3" maxlength="2000" :class="TEXTAREA" />
      </label>
    </template>
  </WizardFrame>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { IonIcon } from '@ionic/vue'
import { addOutline } from 'ionicons/icons'
import FormInput from '@/components/FormInput.vue'
import ChoiceCards from '@/components/forms/ChoiceCards.vue'
import FoodItemEditor from '@/components/forms/FoodItemEditor.vue'
import { MEAL_CHOICES } from '@/components/forms/choices'
import { blankDraft, draftError, draftToItem, type FoodDraft } from '@/components/forms/foodDraft'
import { TEXTAREA } from '@/components/forms/styles'
import { useEntryForm } from '@/composables/useEntryForm'
import { defaultInputFor, localInputToIso } from '@/lib/instants'
import { useJournalStore } from '@/stores/journal'
import type { MealType } from '@/types/journal'
import WizardFrame from './WizardFrame.vue'

const props = defineProps<{ date: string }>()
const emit = defineEmits<{ exit: []; saved: [] }>()
const journal = useJournalStore()
const { saving, error, run } = useEntryForm(() => emit('saved'))

const hour = new Date().getHours()
const step = ref(0)
const mealType = ref<MealType | null>(hour < 11 ? 'breakfast' : hour < 16 ? 'lunch' : hour < 18 ? 'snack' : 'dinner')
const items = reactive<FoodDraft[]>([blankDraft()])
const itemErrors = ref<string[]>([])
const when = ref(defaultInputFor(props.date))
const note = ref('')
const whenError = ref<string>()

/** Totals over rows that have values; shown only when at least one does. */
const total = computed(() => {
  const rows = items.map(draftToItem).filter((i) => i.energyKcal != null)
  if (!rows.length) return null
  const sum = (k: 'energyKcal' | 'proteinG' | 'carbsG' | 'fatG') => rows.reduce((a, i) => a + (i[k] ?? 0), 0)
  const one = (n: number) => Math.round(n * 10) / 10
  return { kcal: Math.round(sum('energyKcal')), p: one(sum('proteinG')), c: one(sum('carbsG')), f: one(sum('fatG')) }
})

function check() {
  if (step.value !== 1) return true
  itemErrors.value = items.map(draftError)
  return !itemErrors.value.some(Boolean)
}

function save() {
  whenError.value = when.value ? undefined : 'Choose when you ate.'
  if (whenError.value || !mealType.value) return
  run(() => journal.saveMeal({ eatenAt: localInputToIso(when.value), mealType: mealType.value!, note: note.value.trim() || null, items: items.map(draftToItem) }))
}
</script>
