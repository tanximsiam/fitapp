<template>
  <div class="rounded-xl bg-page p-3">
    <div class="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_4.5rem_7rem]">
      <div class="relative col-span-2 grid gap-1 text-xs text-muted sm:col-span-1">
        <label :for="`${uid}-name`">Food</label>
        <input
          :id="`${uid}-name`"
          :value="d.name"
          role="combobox"
          aria-autocomplete="list"
          :aria-expanded="showList"
          :aria-controls="`${uid}-list`"
          :aria-activedescendant="showList ? `${uid}-opt-${active}` : undefined"
          :aria-invalid="error ? 'true' : undefined"
          :class="SMALL_INPUT"
          maxlength="100"
          placeholder="Search, e.g. rice"
          autocomplete="off"
          @input="onInput(($event.target as HTMLInputElement).value)"
          @keydown="onKeydown"
          @focus="open = true"
          @blur="open = false"
        />
        <ul
          v-show="showList"
          :id="`${uid}-list`"
          role="listbox"
          :aria-label="`Foods matching ${d.name}`"
          class="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl bg-surface p-1 text-sm text-ink shadow-[0_12px_32px_rgb(0_0_0/0.16)]"
        >
          <li
            v-for="(f, i) in options"
            :id="`${uid}-opt-${i}`"
            :key="f.id"
            role="option"
            :aria-selected="i === active"
            class="flex cursor-pointer items-baseline justify-between gap-3 rounded-lg px-2.5 py-2"
            :class="i === active ? 'bg-accent-soft' : ''"
            @mousedown.prevent="choose(f)"
            @mousemove="active = i"
          >
            <span class="min-w-0 truncate">{{ f.name }}</span>
            <span class="tabular shrink-0 text-xs text-muted">{{ f.per100g[0] }} kcal / 100 g</span>
          </li>
        </ul>
      </div>
      <label class="grid gap-1 text-xs text-muted">
        Amount<input v-model="d.quantity" type="number" min="0" step="any" inputmode="decimal" :class="SMALL_INPUT" />
      </label>
      <label class="grid gap-1 text-xs text-muted">
        Unit
        <select v-if="food" v-model="d.unit" :class="SMALL_INPUT">
          <option v-for="u in unitsOf(food)" :key="u" :value="u">{{ u === 'g' ? 'g' : `${u} (${food.units[u]} g)` }}</option>
        </select>
        <input v-else v-model="d.unit" :class="SMALL_INPUT" maxlength="20" placeholder="g" />
      </label>
    </div>

    <div v-if="food && !d.manual" class="mt-3">
      <dl class="grid grid-cols-4 gap-2" aria-live="polite">
        <div v-for="n in NUTRIENT_FIELDS" :key="n.key" class="rounded-lg bg-surface px-2 py-1.5">
          <dt class="text-[11px] text-muted">{{ n.label }}</dt>
          <dd class="tabular text-sm font-semibold">{{ calc ? calc[n.key] : '–' }}</dd>
        </div>
      </dl>
      <p class="mt-1.5 text-[11px] text-muted">
        Estimate from FitApp's food list.
        <button type="button" class="font-medium text-accent underline underline-offset-2" @click="enterOwn">Enter my own values</button>
      </p>
    </div>
    <div v-else-if="d.manual" class="mt-3">
      <div class="grid grid-cols-4 gap-2">
        <label v-for="n in NUTRIENT_FIELDS" :key="n.key" class="grid gap-1 text-xs text-muted">
          {{ n.label }}<input v-model="d[n.key]" type="number" min="0" step="any" inputmode="decimal" :class="SMALL_INPUT" />
        </label>
      </div>
      <button v-if="food" type="button" class="mt-1.5 text-[11px] font-medium text-accent underline underline-offset-2" @click="d.manual = false">
        Use the food list estimate
      </button>
    </div>
    <p v-else-if="d.name.trim()" class="mt-2 text-[11px] text-muted">
      Not in the food list, so no nutrients are calculated.
      <button type="button" class="font-medium text-accent underline underline-offset-2" @click="d.manual = true">Add values yourself</button>
    </p>

    <div v-if="error || removable" class="mt-2 flex items-center justify-between">
      <p v-if="error" role="alert" class="text-xs text-danger">{{ error }}</p>
      <button v-if="removable" type="button" class="ml-auto text-xs text-muted underline underline-offset-2 hover:text-danger" @click="emit('remove')">
        Remove food
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { findFood, searchFoods, unitsOf, type Food } from '@/data/foods'
import { calculated, NUTRIENT_FIELDS, type FoodDraft } from './foodDraft'
import { SMALL_INPUT } from './styles'

defineProps<{ error?: string; removable?: boolean }>()
const emit = defineEmits<{ remove: [] }>()
const d = defineModel<FoodDraft>({ required: true })
const uid = useId()

const open = ref(false)
const active = ref(0)
const food = computed(() => findFood(d.value.foodId))
const calc = computed(() => calculated(d.value))
const options = computed(() => searchFoods(d.value.name))
const showList = computed(() => open.value && options.value.length > 0 && !food.value)

function onInput(name: string) {
  d.value.name = name
  if (food.value && food.value.name !== name) {
    d.value.foodId = null
    if (!d.value.manual) d.value.unit = ''
  }
  open.value = true
  active.value = 0
}

function choose(f: Food) {
  Object.assign(d.value, { name: f.name, foodId: f.id, manual: false, unit: Object.keys(f.units)[0] ?? 'g' })
  if (!d.value.quantity) d.value.quantity = '1'
  open.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (!showList.value) {
    if (e.key === 'ArrowDown') open.value = true
    return
  }
  const n = options.value.length
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    active.value = (active.value + (e.key === 'ArrowDown' ? 1 : -1) + n) % n
  } else if (e.key === 'Enter') {
    e.preventDefault()
    choose(options.value[active.value])
  } else if (e.key === 'Escape') {
    e.preventDefault()
    open.value = false
  }
}

function enterOwn() {
  const c = calc.value
  Object.assign(d.value, { manual: true, ...(c ? { energyKcal: String(c.energyKcal), proteinG: String(c.proteinG), carbsG: String(c.carbsG), fatG: String(c.fatG) } : {}) })
}
</script>
