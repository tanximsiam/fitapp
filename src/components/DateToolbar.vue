<template>
  <!-- A compact date button (month calendar in a bottom sheet) beside the range selector. -->
  <div class="mb-4 flex flex-wrap items-center gap-2">
    <button
      type="button"
      class="inline-flex min-h-9 items-center gap-2 rounded-full bg-surface px-3.5 text-xs font-medium text-ink shadow-[var(--card-shadow)]"
      aria-haspopup="dialog"
      :aria-label="`Choose a date, ${formatLongDate(fitness.selectedDate)} selected`"
      @click="open = true"
    >
      <ion-icon :icon="calendarOutline" aria-hidden="true" class="text-sm text-ink-2" />
      {{ fitness.isToday ? 'Today' : formatShortDate(fitness.selectedDate) }}
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
import { calendarOutline } from 'ionicons/icons'
import MonthCalendar from '@/components/MonthCalendar.vue'
import RangeTabs from '@/components/RangeTabs.vue'
import { useFitnessData } from '@/composables/useFitnessData'
import { formatLongDate, formatShortDate } from '@/lib/format'

withDefaults(defineProps<{ showRange?: boolean }>(), { showRange: true })
const { fitness, hasData } = useFitnessData()
const open = ref(false)

function pick(date: string) {
  fitness.selectDate(date)
  open.value = false
}
</script>
