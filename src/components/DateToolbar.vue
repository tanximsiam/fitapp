<template>
  <!-- Day stepper, then its own calendar button (month view in a bottom sheet), then the range selector. -->
  <div class="mb-4 flex flex-wrap items-center gap-2">
    <!-- Previous and next day around the date; a swipe would fight chart scrubbing and the iOS back gesture. -->
    <div class="inline-flex min-h-9 items-center rounded-full bg-surface shadow-[var(--card-shadow)]">
      <button type="button" class="grid size-9 place-items-center rounded-full text-ink-2" aria-label="Previous day" @click="step(-1)">
        <ion-icon :icon="chevronBack" aria-hidden="true" />
      </button>
      <span class="min-w-11 px-0.5 text-center text-xs font-medium text-ink" aria-live="polite">
        {{ fitness.isToday ? 'Today' : formatShortDate(fitness.selectedDate) }}<span class="sr-only">, {{ formatLongDate(fitness.selectedDate) }}</span>
      </span>
      <button type="button" class="grid size-9 place-items-center rounded-full text-ink-2 disabled:opacity-30" aria-label="Next day" :disabled="fitness.isToday" @click="step(1)">
        <ion-icon :icon="chevronForward" aria-hidden="true" />
      </button>
    </div>
    <button
      type="button"
      class="grid size-9 place-items-center rounded-full bg-surface text-ink-2 shadow-[var(--card-shadow)]"
      aria-haspopup="dialog"
      aria-label="Choose a date"
      @click="open = true"
    >
      <ion-icon :icon="calendarOutline" aria-hidden="true" class="text-[17px]" />
    </button>
    <button
      v-if="!fitness.isToday"
      type="button"
      class="min-h-9 rounded-full px-3 text-xs font-medium text-accent"
      @click="fitness.selectDate(fitness.today)"
    >
      Back to today
    </button>
    <span v-if="fitness.loading && fitness.loaded" class="text-xs text-muted" role="status">Updating…</span>
    <RangeTabs v-if="showRange" class="ml-auto" :model-value="fitness.rangeDays" @update:model-value="fitness.setRange" />

    <ion-modal :is-open="open" :initial-breakpoint="1" :breakpoints="[0, 1]" class="sheet" @did-dismiss="open = false">
      <div class="px-2 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        <MonthCalendar :model-value="fitness.selectedDate" :today="fitness.today" :has-data="hasData" class="!shadow-none" @update:model-value="pick" />
      </div>
    </ion-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IonIcon, IonModal } from '@ionic/vue'
import { calendarOutline, chevronBack, chevronForward } from 'ionicons/icons'
import { addDays } from '@/lib/dates'
import MonthCalendar from '@/components/MonthCalendar.vue'
import RangeTabs from '@/components/RangeTabs.vue'
import { useFitnessData } from '@/composables/useFitnessData'
import { formatLongDate, formatShortDate } from '@/lib/format'

withDefaults(defineProps<{ showRange?: boolean }>(), { showRange: true })
const { fitness, hasData } = useFitnessData()
const open = ref(false)

const step = (days: number) => fitness.selectDate(addDays(fitness.selectedDate, days))

function pick(date: string) {
  fitness.selectDate(date)
  open.value = false
}
</script>
