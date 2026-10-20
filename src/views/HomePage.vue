<template>
  <AppShell title="Today">
    <template #subtitle>{{ formatLongDate(fitness.today) }}</template>

    <DataState>
      <!-- Calm by design: one sentence up top, then a few focused sections with room between them. -->
      <div class="stagger grid grid-cols-[minmax(0,1fr)] gap-7">
        <HomeHero :day="day" />

        <template v-for="card in shown" :key="card.id">
          <TodayGoals v-if="card.id === 'goals'" :day="day" />

          <section v-else-if="card.id === 'health'" aria-labelledby="vitals-title">
            <SectionHeading id="vitals-title" title="Vitals" to="/health" link="All measurements" />
            <div class="grid grid-cols-2 gap-3">
              <HealthTile
                class="col-span-2"
                to="/health/heart-rate"
                title="Heart rate"
                :icon="ICONS.heartRate"
                tone="heart"
                :value="latestHr ? String(latestHr.bpm) : null"
                unit="bpm"
                :sub="latestHr ? `Latest at ${formatClock(latestHr.at)}${restingText}` : 'No reading uploaded today'"
              />
              <HealthTile to="/health/stress" title="Stress" :icon="ICONS.stress" tone="stress" :value="day?.stress ? String(day.stress.avg) : null" unit="/ 100" sub="Watch estimate" />
              <HealthTile to="/health/blood-oxygen" title="Oxygen" :icon="ICONS.spo2" tone="spo2" :value="day?.spo2 ? `${day.spo2.avg}` : null" unit="%" sub="Overnight" />
            </div>
          </section>

          <section v-else-if="card.id === 'wellbeing'" aria-labelledby="journal-home-title">
            <SectionHeading id="journal-home-title" title="Journal" to="/journal" link="Open" />
            <JournalState><TodayEntries compact /></JournalState>
          </section>

          <section v-else-if="card.id === 'timeline'" aria-labelledby="timeline-title">
            <SectionHeading id="timeline-title" title="Today so far" to="/journal" link="Whole day" />
            <div class="card p-4">
              <JournalState>
                <DayTimeline :rows="recent" empty-text="Nothing recorded yet today." />
              </JournalState>
            </div>
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
import AppShell from '@/components/AppShell.vue'
import DataState from '@/components/DataState.vue'
import DayTimeline from '@/components/DayTimeline.vue'
import HealthTile from '@/components/HealthTile.vue'
import HomeHero from '@/components/HomeHero.vue'
import HomeLayoutSheet from '@/components/HomeLayoutSheet.vue'
import JournalState from '@/components/JournalState.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import TodayEntries from '@/components/TodayEntries.vue'
import TodayGoals from '@/components/TodayGoals.vue'
import { ICONS } from '@/components/metricIcons'
import { useHomeLayout } from '@/composables/useHomeLayout'
import { useJournalData } from '@/composables/useJournalData'
import { dayRows } from '@/data/timeline'
import { formatClock, formatLongDate } from '@/lib/format'

/** Home shows the latest few records; the Journal tab has the whole day. */
const RECENT = 4

const { fitness, journal, mode, selectedDay: day } = useJournalData()

// Home is always today; browsing history happens on the Health pages.
onIonViewWillEnter(() => {
  if (!fitness.isToday) fitness.selectDate(fitness.today)
})

/** The last uploaded reading, shown only when it belongs to today. */
const latestHr = computed(() => {
  const l = fitness.status?.latestHeartRate
  return l && l.at.slice(0, 10) === fitness.today ? l : null
})
const restingText = computed(() => (day.value?.heartRate?.restingBpm != null ? ` · resting ${day.value.heartRate.restingBpm}` : ''))

const anyTracker = computed(() => journal.prefs.mood || journal.prefs.food || journal.prefs.cycle)
const { layout } = useHomeLayout()
const editing = ref(false)
/** Visible cards in the saved order; the journal card needs at least one tracker turned on. */
const shown = computed(() => layout.value.filter((c) => c.visible && (c.id !== 'wellbeing' || anyTracker.value)))
/** The most recent timed records, newest last, so the list reads as the end of the day so far. */
const recent = computed(() => dayRows(day.value, journal.onDate(fitness.today), journal.prefs, mode.isDemo).filter((r) => r.time).slice(-RECENT))
</script>
