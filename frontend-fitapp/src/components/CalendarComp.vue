<template>
  <div class="flex items-center gap-2" role="group" aria-label="Choose a date">
    <button type="button" :class="iconBtn" aria-label="Previous week" @click="shiftWeek(-7)">
      <ion-icon :icon="chevronBackOutline" aria-hidden="true" />
    </button>

    <div ref="strip" class="grid flex-1 grid-cols-7 gap-1" @keydown="onKeydown">
      <button
        v-for="day in week"
        :key="day.date"
        type="button"
        :disabled="day.future"
        :tabindex="day.date === modelValue ? 0 : -1"
        :aria-pressed="day.date === modelValue"
        :aria-label="`${formatLongDate(day.date)}${day.date === today ? ', today' : ''}${hasData(day.date) ? '' : ', no data'}`"
        :data-date="day.date"
        class="flex min-w-0 flex-col items-center gap-0.5 text-center transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-35"
        :class="[
          large ? 'rounded-xl py-2.5' : 'rounded-lg py-1.5',
          day.date === modelValue
            ? 'bg-accent text-accent-ink'
            : large
              ? 'text-ink-2 hover:enabled:bg-page hover:enabled:text-ink'
              : 'text-ink-2 hover:enabled:bg-surface hover:enabled:text-ink',
        ]"
        @click="emit('update:modelValue', day.date)"
      >
        <span class="uppercase tracking-wide opacity-80" :class="large ? 'text-xs' : 'text-[11px]'">{{ day.weekday }}</span>
        <span class="tabular font-medium" :class="[large ? 'text-xl font-semibold' : 'text-sm', day.date === today && day.date !== modelValue ? 'text-accent' : '']">{{ day.dayOfMonth }}</span>
        <span
          class="size-1 rounded-full"
          :class="hasData(day.date) ? (day.date === modelValue ? 'bg-accent-ink' : 'bg-ink-2') : 'bg-transparent'"
          aria-hidden="true"
        />
      </button>
    </div>

    <button type="button" :class="iconBtn" aria-label="Next week" :disabled="weekEnd >= today" @click="shiftWeek(7)">
      <ion-icon :icon="chevronForwardOutline" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { IonIcon } from '@ionic/vue'
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons'
import { addDays, weekday } from '@/lib/dates'
import { formatLongDate, formatWeekday } from '@/lib/format'
import type { ISODate } from '@/types/fitness'

const props = defineProps<{
  modelValue: ISODate
  today: ISODate
  hasData: (date: ISODate) => boolean
  /** Bigger chips for the overview, where the strip sits in its own card. */
  large?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [ISODate] }>()

const strip = ref<HTMLElement | null>(null)
const iconBtn =
  'grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-surface text-ink-2 transition-colors duration-150 hover:enabled:border-line-strong hover:enabled:text-ink disabled:opacity-35'

/** Sunday-start week containing the selected date; the current week ends at today instead of showing future days. */
const weekStart = computed(() => {
  const start = addDays(props.modelValue, -weekday(props.modelValue))
  return addDays(start, 6) > props.today ? addDays(props.today, -6) : start
})
const weekEnd = computed(() => addDays(weekStart.value, 6))
const week = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart.value, i)
    return { date, weekday: formatWeekday(date).slice(0, 2), dayOfMonth: Number(date.slice(8)), future: date > props.today }
  }),
)

function shiftWeek(days: number) {
  const target = addDays(props.modelValue, days)
  emit('update:modelValue', target > props.today ? props.today : target)
}

function onKeydown(e: KeyboardEvent) {
  const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key]
  if (!step) return
  e.preventDefault()
  const target = addDays(props.modelValue, step)
  if (target > props.today) return
  emit('update:modelValue', target)
  nextTick(() => strip.value?.querySelector<HTMLElement>(`[data-date="${target}"]`)?.focus())
}
</script>
