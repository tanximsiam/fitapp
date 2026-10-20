<template>
  <AppShell title="Today">
    <template #subtitle>{{ formatLongDate(fitness.today) }}</template>

    <DataState>
      <div class="stagger grid grid-cols-[minmax(0,1fr)] gap-4">
        <template v-for="card in shown" :key="card.id">
        <TodayNudge v-if="card.id === 'goals'" :day="day" />

        <section v-else-if="card.id === 'health'" aria-labelledby="health-title">
          <SectionHeading id="health-title" title="Today's health" to="/health" link="All measurements" />
          <div class="grid grid-cols-2 gap-3">
            <HealthTile
              to="/health/heart-rate"
              title="Heart rate"
              :icon="ICONS.heartRate"
              tone="heart"
              :value="latestHr ? String(latestHr.bpm) : null"
              unit="bpm"
              :sub="latestHr ? `at ${formatClock(latestHr.at)}${restingText}` : 'No reading uploaded'"
            />
            <HealthTile
              to="/health/activity"
              title="Distance"
              :icon="ICONS.distance"
              tone="activity"
              :value="a?.distanceM == null ? null : formatKm(a.distanceM).replace(' km', '')"
              unit="km"
              :sub="activitySub"
            />
            <HealthTile
              class="col-span-2"
              to="/health/sleep"
              title="Last night"
              :icon="ICONS.sleep"
              tone="sleep"
              :value="s ? `${formatClock(s.startAt)}–${formatClock(s.endAt)}` : null"
              :sub="s ? (s.stages ? stageText : 'Stages not reported') + (s.score != null ? ` · score ${s.score} from the watch` : '') : 'No sleep recorded'"
            >
              <div v-if="s?.stages" class="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
                <span v-for="p in stageParts" :key="p.key" :style="{ flexGrow: p.minutes, background: p.color }" />
              </div>
            </HealthTile>
            <HealthTile
              to="/health/stress"
              title="Stress"
              :icon="ICONS.stress"
              tone="stress"
              :value="day?.stress ? String(day.stress.avg) : null"
              unit="/ 100"
              :sub="day?.stress ? 'Watch estimate' : undefined"
            />
            <HealthTile
              to="/health/blood-oxygen"
              title="Oxygen"
              :icon="ICONS.spo2"
              tone="spo2"
              :value="day?.spo2 ? `${day.spo2.avg}` : null"
              unit="%"
              :sub="day?.spo2 ? `Overnight · lowest ${day.spo2.min}%` : undefined"
            />
          </div>
        </section>

        <section v-else-if="card.id === 'wellbeing'" aria-label="Personal wellbeing">
          <JournalState><TodayEntries /></JournalState>
        </section>

        <section v-else-if="card.id === 'timeline'" class="card p-4" aria-labelledby="timeline-title">
          <SectionHeading id="timeline-title" title="Today so far" class="!mb-4" />
          <JournalState>
            <DayTimeline :rows="rows" empty-text="Nothing recorded yet today." />
          </JournalState>
        </section>
        </template>

        <button type="button" class="mx-auto inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-ink-2" @click="editing = true">
          <ion-icon :icon="optionsOutline" aria-hidden="true" />Customise Home
        </button>
      </div>
      <HomeLayoutSheet v-model:open="editing" />
    </DataState>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { IonIcon, onIonViewWillEnter } from '@ionic/vue'
import { optionsOutline } from 'ionicons/icons'
import HomeLayoutSheet from '@/components/HomeLayoutSheet.vue'
import { useHomeLayout } from '@/composables/useHomeLayout'
import AppShell from '@/components/AppShell.vue'
import DataState from '@/components/DataState.vue'
import DayTimeline from '@/components/DayTimeline.vue'
import HealthTile from '@/components/HealthTile.vue'
import JournalState from '@/components/JournalState.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import TodayEntries from '@/components/TodayEntries.vue'
import TodayNudge from '@/components/TodayNudge.vue'
import { ICONS } from '@/components/metricIcons'
import { SLEEP_STAGES } from '@/components/sleepStages'
import { useJournalData } from '@/composables/useJournalData'
import { dayRows } from '@/data/timeline'
import { formatClock, formatDuration, formatKm, formatLongDate } from '@/lib/format'

const { fitness, journal, mode, selectedDay: day } = useJournalData()

// Home is always today; browsing history happens on the Health pages.
onIonViewWillEnter(() => {
  if (!fitness.isToday) fitness.selectDate(fitness.today)
})

const a = computed(() => day.value?.activity ?? null)
const s = computed(() => day.value?.sleep ?? null)

/** The last uploaded reading, shown only when it belongs to today. */
const latestHr = computed(() => {
  const l = fitness.status?.latestHeartRate
  return l && l.at.slice(0, 10) === fitness.today ? l : null
})
const restingText = computed(() => (day.value?.heartRate?.restingBpm != null ? ` · resting ${day.value.heartRate.restingBpm}` : ''))
const activitySub = computed(() => {
  if (!a.value) return 'No activity recorded'
  const parts = [a.value.activeMinutes != null ? `${formatDuration(a.value.activeMinutes)} active` : null]
  const w = day.value?.workouts.length ?? 0
  if (w) parts.push(`${w} workout${w > 1 ? 's' : ''}`)
  return parts.filter(Boolean).join(' · ')
})

const stageParts = computed(() =>
  [...SLEEP_STAGES].reverse().map((st) => ({ ...st, minutes: s.value?.stages?.[st.key] ?? 0 })).filter((p) => p.minutes > 0),
)
const stageText = computed(() => {
  const deep = s.value?.stages?.deepMin
  const rem = s.value?.stages?.remMin
  return [deep != null ? `Deep ${formatDuration(deep)}` : null, rem != null ? `REM ${formatDuration(rem)}` : null].filter(Boolean).join(' · ')
})

const anyTracker = computed(() => journal.prefs.mood || journal.prefs.food || journal.prefs.cycle)
const { layout } = useHomeLayout()
const editing = ref(false)
/** Visible cards in the saved order; the journal card needs at least one tracker turned on. */
const shown = computed(() => layout.value.filter((c) => c.visible && (c.id !== 'wellbeing' || anyTracker.value)))
const rows = computed(() => dayRows(day.value, journal.onDate(fitness.today), journal.prefs, mode.isDemo))
</script>
