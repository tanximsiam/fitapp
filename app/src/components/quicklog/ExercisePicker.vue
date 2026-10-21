<template>
  <!-- A text field with matching exercises listed right below it, inside the card (no floating popup). -->
  <div class="min-w-0 flex-1">
    <input
      v-model="name"
      type="text"
      role="combobox"
      maxlength="60"
      autocomplete="off"
      :aria-label="label"
      aria-autocomplete="list"
      :aria-expanded="open"
      :aria-controls="listId"
      :aria-activedescendant="open && active >= 0 ? `${listId}-${active}` : undefined"
      placeholder="Exercise, e.g. Push-ups"
      class="min-h-11 w-full rounded-xl border bg-surface px-3 text-base text-ink placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
      :class="invalid ? 'border-danger' : 'border-line-strong'"
      @focus="focused = true"
      @blur="focused = false"
      @input="active = 0"
      @keydown="onKey"
    />
    <ul v-show="open" :id="listId" role="listbox" :aria-label="`${label} suggestions`" class="mt-1.5 overflow-hidden rounded-xl bg-surface py-1 shadow-[var(--card-shadow)] ring-1 ring-line">
      <li
        v-for="(e, i) in matches"
        :id="`${listId}-${i}`"
        :key="e.name"
        role="option"
        :aria-selected="i === active"
        class="flex min-h-10 cursor-pointer items-center px-3 text-[15px]"
        :class="i === active ? 'bg-accent-soft text-ink' : 'text-ink-2'"
        @mousedown.prevent="choose(e.name)"
        @mousemove="active = i"
      >
        <span class="truncate">
          {{ e.name.slice(0, hit(e.name)) }}<strong class="font-semibold text-ink">{{ e.name.slice(hit(e.name), hit(e.name) + query.length) }}</strong>{{ e.name.slice(hit(e.name) + query.length) }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { searchExercises } from '@/data/exercises'

defineProps<{ label: string; invalid?: boolean }>()
const name = defineModel<string>({ required: true })
const listId = useId()
const focused = ref(false)
const active = ref(0)

const query = computed(() => name.value.trim())
const matches = computed(() => searchExercises(name.value))
// Hidden once the field holds exactly a suggested name.
const open = computed(() => focused.value && matches.value.length > 0 && !(matches.value.length === 1 && matches.value[0].name === query.value))
const hit = (n: string) => n.toLowerCase().indexOf(query.value.toLowerCase())

function choose(n: string) {
  name.value = n
  active.value = 0
}

function onKey(e: KeyboardEvent) {
  if (!open.value) return
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    const step = e.key === 'ArrowDown' ? 1 : -1
    active.value = (active.value + step + matches.value.length) % matches.value.length
  } else if (e.key === 'Enter' && active.value >= 0) {
    // Enter picks the highlighted exercise instead of submitting the step.
    e.preventDefault()
    choose(matches.value[active.value].name)
  } else if (e.key === 'Escape') {
    focused.value = false
  }
}
</script>
