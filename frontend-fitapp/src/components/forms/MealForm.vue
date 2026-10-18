<template>
  <form class="grid gap-4" novalidate @submit.prevent="submit">
    <div class="grid gap-4 sm:grid-cols-2">
      <FormInput v-model="when" label="When" type="datetime-local" :error="!!whenError" :hint="whenError" />
      <label class="grid gap-1.5 text-sm font-medium text-ink-2">
        Meal
        <select v-model="mealType" :class="SELECT">
          <option v-for="t in MEAL_TYPES" :key="t" :value="t">{{ t[0].toUpperCase() + t.slice(1) }}</option>
        </select>
      </label>
    </div>

    <fieldset class="min-w-0">
      <legend class="mb-1 text-sm font-medium text-ink-2">Foods</legend>
      <p class="mb-3 text-xs text-muted">Nutrition values are optional. Enter them only if you know them, for example from the packaging. FitApp never estimates them.</p>
      <div v-for="(item, i) in items" :key="i" class="mb-3 rounded-lg border border-line p-3">
        <div class="grid grid-cols-[1fr_5rem_5rem] gap-2">
          <label class="grid gap-1 text-xs text-muted">Food<input v-model="item.name" :class="SMALL_INPUT" maxlength="100" :aria-invalid="itemErrors[i] ? 'true' : undefined" /></label>
          <label class="grid gap-1 text-xs text-muted">Amount<input v-model="item.quantity" type="number" min="0" step="any" inputmode="decimal" :class="SMALL_INPUT" /></label>
          <label class="grid gap-1 text-xs text-muted">Unit<input v-model="item.unit" :class="SMALL_INPUT" maxlength="20" placeholder="g" /></label>
        </div>
        <div class="mt-2 grid grid-cols-4 gap-2">
          <label v-for="n in NUTRIENTS" :key="n.key" class="grid gap-1 text-xs text-muted">
            {{ n.label }}<input v-model="item[n.key]" type="number" min="0" step="any" inputmode="decimal" :class="SMALL_INPUT" />
          </label>
        </div>
        <div class="mt-2 flex items-center justify-between">
          <p v-if="itemErrors[i]" role="alert" class="text-xs text-danger">{{ itemErrors[i] }}</p>
          <button v-if="items.length > 1" type="button" class="ml-auto text-xs text-muted underline underline-offset-2 hover:text-danger" @click="items.splice(i, 1)">
            Remove food
          </button>
        </div>
      </div>
      <button type="button" class="text-sm font-medium text-accent underline underline-offset-2" @click="items.push(blank())">Add another food</button>
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
import { SELECT, SMALL_INPUT, TEXTAREA } from './styles'
import { useEntryForm } from '@/composables/useEntryForm'
import { defaultInputFor, isoToLocalInput, localInputToIso } from '@/lib/instants'
import { useJournalStore } from '@/stores/journal'
import { MEAL_TYPES, type Meal, type MealItem, type MealType } from '@/types/journal'

type Draft = { name: string; quantity: string; unit: string; energyKcal: string; proteinG: string; carbsG: string; fatG: string }
const NUTRIENTS = [
  { key: 'energyKcal', label: 'kcal' },
  { key: 'proteinG', label: 'Protein g' },
  { key: 'carbsG', label: 'Carbs g' },
  { key: 'fatG', label: 'Fat g' },
] as const

const props = withDefaults(defineProps<{ date: string; existing?: Meal; cancellable?: boolean }>(), { existing: undefined, cancellable: true })
const emit = defineEmits<{ done: [] }>()
const journal = useJournalStore()
const { saving, error, run } = useEntryForm(() => emit('done'))

const str = (v: number | null) => (v == null ? '' : String(v))
const blank = (): Draft => ({ name: '', quantity: '', unit: '', energyKcal: '', proteinG: '', carbsG: '', fatG: '' })
const toDraft = (i: MealItem): Draft => ({
  name: i.name,
  quantity: str(i.quantity),
  unit: i.unit ?? '',
  energyKcal: str(i.energyKcal),
  proteinG: str(i.proteinG),
  carbsG: str(i.carbsG),
  fatG: str(i.fatG),
})

const hour = new Date().getHours()
const guessType: MealType = hour < 11 ? 'breakfast' : hour < 16 ? 'lunch' : hour < 18 ? 'snack' : 'dinner'
const when = ref(props.existing ? isoToLocalInput(props.existing.eatenAt) : defaultInputFor(props.date))
const mealType = ref<MealType>(props.existing?.mealType ?? guessType)
const items = reactive<Draft[]>(props.existing ? props.existing.items.map(toDraft) : [blank()])
const note = ref(props.existing?.note ?? '')
const whenError = ref<string>()
const itemErrors = ref<string[]>([])

/** Empty → null; anything else must be a non-negative number. */
const num = (v: string) => (String(v).trim() === '' ? null : Number(v))

function submit() {
  whenError.value = when.value ? undefined : 'Choose when you ate.'
  itemErrors.value = items.map((d) => {
    if (!d.name.trim()) return 'Name the food.'
    const values = [d.quantity, d.energyKcal, d.proteinG, d.carbsG, d.fatG].map(num)
    if (values.some((v) => v !== null && (!Number.isFinite(v) || v < 0))) return 'Amounts must be zero or more.'
    if (num(d.quantity) === 0) return 'Amount must be more than zero.'
    return ''
  })
  if (whenError.value || itemErrors.value.some(Boolean)) return
  run(() =>
    journal.saveMeal(
      {
        eatenAt: localInputToIso(when.value),
        mealType: mealType.value,
        note: note.value.trim() || null,
        items: items.map((d) => ({
          name: d.name.trim(),
          quantity: num(d.quantity),
          unit: d.unit.trim() || null,
          energyKcal: num(d.energyKcal),
          proteinG: num(d.proteinG),
          carbsG: num(d.carbsG),
          fatG: num(d.fatG),
        })),
      },
      props.existing,
    ),
  )
}

const remove = () => run(() => journal.remove('meals', props.existing!.id))
</script>
