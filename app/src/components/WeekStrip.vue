<template>
  <!-- This week, Sunday to Saturday. Today is the teal pill; a past day opens Health on that date. -->
  <ol class="grid grid-cols-7 gap-1.5" aria-label="This week">
    <li v-for="d in week" :key="d.date">
      <button
        type="button"
        class="flex h-[60px] w-full flex-col items-center justify-center gap-1 rounded-full transition-[scale] duration-150 ease-out active:enabled:scale-95"
        :class="d.isToday ? 'bg-accent text-accent-ink' : d.future ? 'text-muted opacity-50' : 'bg-surface shadow-[var(--card-shadow)]'"
        :disabled="d.future || d.isToday"
        :aria-label="d.label"
        :aria-current="d.isToday ? 'date' : undefined"
        @click="open(d.date)"
      >
        <span class="text-[11px] font-medium" :class="d.isToday ? '' : 'text-ink-2'" aria-hidden="true">{{ d.letter }}</span>
        <span class="tabular text-[15px] font-semibold" aria-hidden="true">{{ d.day }}</span>
      </button>
    </li>
  </ol>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { addDays, weekday } from '@/lib/dates'
import { formatLongDate, formatWeekday } from '@/lib/format'
import { useFitnessStore } from '@/stores/fitness'

const fitness = useFitnessStore()
const router = useRouter()

const week = computed(() => {
  const today = fitness.today
  const sunday = addDays(today, -weekday(today))
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(sunday, i)
    const isToday = date === today
    const future = date > today
    return {
      date,
      isToday,
      future,
      letter: formatWeekday(date)[0],
      day: Number(date.slice(8)),
      label: `${formatLongDate(date)}${isToday ? ', today' : future ? ', upcoming' : ''}`,
    }
  })
})

/** Home is always today; a past day opens Health on that date. */
async function open(date: string) {
  await fitness.selectDate(date)
  router.push('/health')
}
</script>
