<template>
  <section class="card p-4 sm:p-5" aria-labelledby="month-title">
    <div class="flex items-center gap-2">
      <h2 id="month-title" class="flex-1 text-[15px] font-semibold tracking-tight" aria-live="polite">{{ monthLabel }}</h2>
      <button
        v-if="modelValue !== today"
        type="button"
        class="rounded-full px-2.5 py-1 text-xs font-medium text-accent transition-colors duration-150 hover:bg-accent-soft"
        @click="emit('update:modelValue', today)"
      >
        Today
      </button>
      <button type="button" :class="NAV" aria-label="Previous month" @click="shiftMonth(-1)">
        <ion-icon :icon="chevronBack" aria-hidden="true" />
      </button>
      <button type="button" :class="NAV" aria-label="Next month" :disabled="month >= today.slice(0, 7)" @click="shiftMonth(1)">
        <ion-icon :icon="chevronForward" aria-hidden="true" />
      </button>
    </div>

    <div class="mt-4 grid grid-cols-7 text-center text-[11px] font-medium text-muted" aria-hidden="true">
      <span v-for="w in WEEKDAYS" :key="w">{{ w }}</span>
    </div>
    <div ref="grid" class="mt-1 grid grid-cols-7 gap-y-1" role="group" :aria-label="`Choose a date in ${monthLabel}`" @keydown="onKeydown">
      <span v-for="n in lead" :key="`lead${n}`" aria-hidden="true" />
      <button
        v-for="d in days"
        :key="d.date"
        type="button"
        :data-date="d.date"
        :disabled="d.date > today"
        :tabindex="d.date === focusDate ? 0 : -1"
        :aria-pressed="d.date === modelValue"
        :aria-label="`${formatLongDate(d.date)}${d.date === today ? ', today' : ''}${hasData(d.date) ? '' : ', no watch data loaded'}`"
        class="relative mx-auto grid size-9 place-items-center rounded-full text-sm transition-colors duration-150 disabled:cursor-not-allowed disabled:text-line-strong"
        :class="
          d.date === modelValue
            ? 'bg-accent font-semibold text-accent-ink'
            : d.date === today
              ? 'font-semibold text-accent ring-1 ring-accent ring-inset hover:bg-accent-soft'
              : 'text-ink-2 hover:enabled:bg-page hover:enabled:text-ink'
        "
        @click="emit('update:modelValue', d.date)"
      >
        <span class="tabular">{{ d.day }}</span>
        <span
          v-if="hasData(d.date)"
          class="absolute bottom-1 size-1 rounded-full"
          :class="d.date === modelValue ? 'bg-accent-ink' : 'bg-accent'"
          aria-hidden="true"
        />
      </button>
    </div>
    <p class="mt-3 flex items-center gap-1.5 text-[11px] text-muted"><span class="size-1 rounded-full bg-accent" aria-hidden="true" />Watch data loaded</p>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { IonIcon } from '@ionic/vue'
import { chevronBack, chevronForward } from 'ionicons/icons'
import { addDays, weekday } from '@/lib/dates'
import { formatLongDate } from '@/lib/format'
import type { ISODate } from '@/types/fitness'

const props = defineProps<{ modelValue: ISODate; today: ISODate; hasData: (date: ISODate) => boolean }>()
const emit = defineEmits<{ 'update:modelValue': [ISODate] }>()

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const NAV =
  'grid size-8 place-items-center rounded-full text-ink-2 ring-1 ring-line transition-colors duration-150 hover:enabled:bg-page hover:enabled:text-ink disabled:opacity-35'

const grid = ref<HTMLElement | null>(null)
/** The month on show, "YYYY-MM"; follows the selected date and can be paged independently. */
const month = ref(props.modelValue.slice(0, 7))
watch(
  () => props.modelValue,
  (d) => (month.value = d.slice(0, 7)),
)

const first = computed(() => `${month.value}-01` as ISODate)
const lead = computed(() => weekday(first.value))
const days = computed(() => {
  const out: { date: ISODate; day: number }[] = []
  for (let d = first.value; d.startsWith(month.value); d = addDays(d, 1)) out.push({ date: d, day: Number(d.slice(8)) })
  return out
})
const monthLabel = computed(() => new Date(`${first.value}T00:00:00Z`).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' }))
/** The one day button in the tab order: the selection when it is on show, else the 1st. */
const focusDate = computed(() => (props.modelValue.startsWith(month.value) ? props.modelValue : first.value))

function shiftMonth(step: number) {
  const [y, m] = month.value.split('-').map(Number)
  const next = new Date(Date.UTC(y, m - 1 + step, 1))
  month.value = next.toISOString().slice(0, 7)
}

function onKeydown(e: KeyboardEvent) {
  const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key]
  if (!step) return
  e.preventDefault()
  const target = addDays(focusDate.value, step)
  if (target > props.today) return
  emit('update:modelValue', target)
  nextTick(() => grid.value?.querySelector<HTMLElement>(`[data-date="${target}"]`)?.focus())
}
</script>
