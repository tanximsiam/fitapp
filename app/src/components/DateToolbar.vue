<template>
  <!--
    One place to set what the page shows: how much history (range) and which day (calendar).
    The calendar sheet has its own "Today" button; on a past day the calendar button turns teal.
  -->
  <div class="mb-4 flex items-center gap-2">
    <RangeTabs v-if="showRange" :model-value="fitness.rangeDays" @update:model-value="fitness.setRange" />
    <button
      type="button"
      class="grid size-9 place-items-center rounded-full shadow-[var(--card-shadow)] transition-colors duration-150"
      :class="fitness.isToday ? 'bg-surface text-ink-2' : 'bg-accent text-accent-ink'"
      aria-haspopup="dialog"
      :aria-label="`Choose a date, ${fitness.isToday ? 'today' : formatLongDate(fitness.selectedDate)} selected`"
      @click="open = true"
    >
      <ion-icon :icon="calendarOutline" aria-hidden="true" class="text-[17px]" />
    </button>
    <span v-if="fitness.loading && fitness.loaded" class="text-xs text-muted" role="status">Updating…</span>

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
import { formatLongDate } from '@/lib/format'

withDefaults(defineProps<{ showRange?: boolean }>(), { showRange: true })
const { fitness, hasData } = useFitnessData()
const open = ref(false)

function pick(date: string) {
  fitness.selectDate(date)
  open.value = false
}
</script>
