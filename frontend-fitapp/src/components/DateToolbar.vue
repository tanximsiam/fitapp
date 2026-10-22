<template>
  <!-- Range selector with a compact date picker beside it; the month calendar opens on demand. -->
  <div class="mb-4 flex flex-wrap items-center justify-end gap-2">
    <span v-if="fitness.loading && fitness.loaded" class="text-xs text-muted" role="status">Updating…</span>
    <button
      v-if="!fitness.isToday"
      type="button"
      class="rounded-full px-3 py-1.5 text-xs font-medium text-accent transition-colors duration-150 hover:bg-accent-soft"
      @click="fitness.selectDate(fitness.today)"
    >
      Back to today
    </button>

    <div ref="root" class="relative">
      <button
        type="button"
        class="inline-flex min-h-9 items-center gap-2 rounded-full px-3.5 text-xs font-medium shadow-[var(--card-shadow)] transition-colors duration-150"
        :class="fitness.isToday ? 'bg-surface text-ink' : 'bg-accent text-accent-ink'"
        :aria-expanded="open"
        :aria-controls="panelId"
        aria-haspopup="dialog"
        :aria-label="`Choose a date, ${formatLongDate(fitness.selectedDate)} selected`"
        @click="open = !open"
      >
        <ion-icon :icon="calendarOutline" aria-hidden="true" class="text-sm" />
        {{ fitness.isToday ? 'Today' : formatShortDate(fitness.selectedDate) }}
        <ion-icon :icon="chevronDown" aria-hidden="true" class="transition-transform duration-150" :class="open ? 'rotate-180' : ''" />
      </button>
      <div
        v-if="open"
        :id="panelId"
        role="dialog"
        aria-label="Choose a date"
        class="picker absolute right-0 z-30 mt-2 w-[19rem] rounded-2xl shadow-[0_16px_40px_rgb(0_0_0/0.16)]"
        @keydown.esc="close"
      >
        <MonthCalendar :model-value="fitness.selectedDate" :today="fitness.today" :has-data="hasData" @update:model-value="pick" />
      </div>
    </div>

    <RangeTabs v-if="showRange" :model-value="fitness.rangeDays" @update:model-value="fitness.setRange" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, useId, watch } from 'vue'
import { IonIcon } from '@ionic/vue'
import { calendarOutline, chevronDown } from 'ionicons/icons'
import MonthCalendar from '@/components/MonthCalendar.vue'
import RangeTabs from '@/components/RangeTabs.vue'
import { useFitnessData } from '@/composables/useFitnessData'
import { formatLongDate, formatShortDate } from '@/lib/format'

withDefaults(defineProps<{ showRange?: boolean }>(), { showRange: true })
const { fitness, hasData } = useFitnessData()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const panelId = useId()

function pick(date: string) {
  fitness.selectDate(date)
  close()
}
function close() {
  open.value = false
  root.value?.querySelector<HTMLElement>('button')?.focus()
}
// Close when clicking anywhere outside the picker.
function onPointer(e: PointerEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) open.value = false
}
watch(open, (o) => (o ? document.addEventListener('pointerdown', onPointer) : document.removeEventListener('pointerdown', onPointer)))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointer))
</script>
