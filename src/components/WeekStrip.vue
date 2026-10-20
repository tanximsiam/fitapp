<template>
  <!--
    This week at a glance, Sunday to Saturday. Past days: a check when the step goal was met, a dot when the
    watch recorded the day without reaching it, nothing when there is no data (a gap is not a miss).
    Today is the teal pill with a small ring for steps so far. A past day opens Health on that date.
  -->
  <ol class="grid grid-cols-7 gap-1.5" aria-label="This week">
    <li v-for="d in week" :key="d.date">
      <button
        type="button"
        class="flex h-[76px] w-full flex-col items-center justify-center gap-1 rounded-full transition-[scale] duration-150 ease-out active:enabled:scale-95"
        :class="d.isToday ? 'bg-accent text-accent-ink' : d.future ? 'text-muted opacity-50' : 'bg-surface shadow-[var(--card-shadow)]'"
        :disabled="d.future || d.isToday"
        :aria-label="d.label"
        :aria-current="d.isToday ? 'date' : undefined"
        @click="open(d.date)"
      >
        <span class="grid h-3.5 place-items-center" aria-hidden="true">
          <svg v-if="d.isToday" viewBox="0 0 16 16" class="size-3.5 -rotate-90">
            <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-opacity="0.35" stroke-width="2.4" />
            <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" :stroke-dasharray="`${RING * Math.min(1, d.ratio ?? 0)} ${RING}`" />
          </svg>
          <ion-icon v-else-if="d.met" :icon="checkmark" class="text-sm text-accent" />
          <span v-else-if="d.measured" class="size-1.5 rounded-full bg-line-strong" />
        </span>
        <span class="text-[11px] font-medium" :class="d.isToday ? '' : 'text-ink-2'">{{ d.weekday }}</span>
        <span class="tabular text-[15px] font-semibold">{{ d.day }}</span>
      </button>
    </li>
  </ol>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import { checkmark } from 'ionicons/icons'
import { progress } from '@/data/derive'
import { addDays, weekday } from '@/lib/dates'
import { formatInt, formatLongDate, formatWeekday } from '@/lib/format'
import { useFitnessStore } from '@/stores/fitness'

const RING = 2 * Math.PI * 6

const fitness = useFitnessStore()
const router = useRouter()

const week = computed(() => {
  const today = fitness.today
  const sunday = addDays(today, -weekday(today))
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(sunday, i)
    const steps = fitness.days.find((x) => x.date === date)?.activity?.steps ?? null
    const ratio = progress(steps, fitness.goals.steps)
    const isToday = date === today
    const future = date > today
    const met = ratio != null && ratio >= 1
    const status = future ? 'upcoming' : isToday ? `today, ${steps == null ? 'no steps yet' : `${formatInt(steps)} steps so far`}` : met ? 'step goal reached' : steps != null ? 'step goal not reached' : 'no data'
    return { date, isToday, future, ratio, met, measured: steps != null, weekday: formatWeekday(date), day: Number(date.slice(8)), label: `${formatLongDate(date)}: ${status}` }
  })
})

/** Home is always today; a past day opens Health on that date. */
async function open(date: string) {
  await fitness.selectDate(date)
  router.push('/health')
}
</script>
