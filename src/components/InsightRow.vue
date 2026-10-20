<template>
  <li class="py-3">
    <div class="flex items-start gap-3">
      <span
        class="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg"
        :class="tone ? `tone tone-${tone}` : 'bg-page'"
        :title="label"
        aria-hidden="true"
      >
        <ion-icon :icon="icon" class="text-base" :style="{ color: tone ? 'var(--tone-ink)' : 'var(--ink-2)' }" />
      </span>
      <div class="min-w-0 flex-1">
        <p class="text-sm" :class="insight.status === 'ok' ? 'text-ink' : 'text-muted'">
          <span class="sr-only">{{ label }}: </span>{{ insight.text }}
        </p>
        <details class="mt-1">
          <summary class="cursor-pointer text-xs text-muted select-none hover:text-ink">How this is calculated</summary>
          <div class="mt-2 rounded-lg bg-page p-3 text-xs text-ink-2">
            <p>{{ insight.calculation }}</p>
            <p class="mt-1">Period: {{ formatShortDate(insight.range.from) }}–{{ formatShortDate(insight.range.to) }}</p>
            <table v-if="insight.counts.length" class="mt-2">
              <tbody>
                <tr v-for="c in insight.counts" :key="c.label">
                  <th scope="row" class="pr-4 text-left font-normal text-muted">{{ c.label }}</th>
                  <td class="tabular text-ink">{{ c.value }}</td>
                </tr>
              </tbody>
            </table>
            <RouterLink :to="insight.link" class="mt-2 inline-block font-medium text-accent underline underline-offset-2">View the records</RouterLink>
          </div>
        </details>
      </div>
    </div>
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { ICONS } from '@/components/metricIcons'
import type { Area, Insight } from '@/insights/engine'
import type { Tone } from '@/components/PanelSection.vue'
import { formatShortDate } from '@/lib/format'

const props = defineProps<{ insight: Insight }>()

const AREAS: Record<Area, { label: string; icon: string; tone?: Tone }> = {
  activity: { label: 'Activity', icon: ICONS.activity, tone: 'activity' },
  sleep: { label: 'Sleep', icon: ICONS.sleep, tone: 'sleep' },
  heart: { label: 'Heart rate', icon: ICONS.heartRate, tone: 'heart' },
  stress: { label: 'Stress', icon: ICONS.stress, tone: 'stress' },
  oxygen: { label: 'Blood oxygen', icon: ICONS.spo2, tone: 'spo2' },
  skin: { label: 'Skin temperature', icon: ICONS.skinTemp, tone: 'skin' },
  mood: { label: 'Mood', icon: ICONS.mood, tone: 'mood' },
  food: { label: 'Food', icon: ICONS.meals, tone: 'energy' },
  cycle: { label: 'Periods', icon: ICONS.cycle, tone: 'mood' },
  combined: { label: 'Combined', icon: ICONS.combined },
}
const label = computed(() => AREAS[props.insight.area].label)
const icon = computed(() => AREAS[props.insight.area].icon)
const tone = computed(() => AREAS[props.insight.area].tone)
</script>
