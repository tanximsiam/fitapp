<template>
  <PanelSection title="Body signals" variant="plain">
    <template #aside><p class="text-xs text-muted">From the watch</p></template>
    <ul class="grid gap-3 sm:grid-cols-3">
      <li v-for="s in items" :key="s.to">
        <RouterLink
          :to="s.to"
          class="tone block rounded-2xl px-4 py-3.5 transition-[filter,transform] duration-150 ease-out hover:brightness-[0.98] active:scale-[0.99]"
          :class="`tone-${s.tone}`"
        >
          <span class="flex items-center gap-2 text-xs text-muted">
            <ion-icon :icon="s.icon" aria-hidden="true" class="text-sm" :style="{ color: 'var(--tone-ink)' }" />{{ s.label }}
          </span>
          <span class="tabular mt-1 block text-lg font-semibold tracking-tight" :class="s.value === EMPTY ? 'text-muted' : ''">{{ s.value }}</span>
          <span class="block text-xs text-ink-2">{{ s.note }}</span>
        </RouterLink>
      </li>
    </ul>
  </PanelSection>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { ICONS } from '@/components/metricIcons'
import PanelSection from '@/components/PanelSection.vue'
import { formatDeviation } from '@/data/signals'
import { EMPTY } from '@/lib/format'
import { useFitnessStore } from '@/stores/fitness'

const fitness = useFitnessStore()

const items = computed(() => {
  const d = fitness.selectedDay
  return [
    {
      to: '/stress',
      label: 'Stress',
      icon: ICONS.stress,
      tone: 'stress',
      color: 'var(--stress)',
      value: d?.stress ? `${d.stress.avg} / 100` : EMPTY,
      note: d?.stress ? `average, ${d.stress.sampleCount} readings` : 'no readings',
    },
    {
      to: '/blood-oxygen',
      label: 'Blood oxygen',
      icon: ICONS.spo2,
      tone: 'spo2',
      color: 'var(--spo2)',
      value: d?.spo2 ? `${d.spo2.avg}%` : EMPTY,
      note: d?.spo2 ? `overnight average, lowest ${d.spo2.min}%` : 'no readings last night',
    },
    {
      to: '/skin-temperature',
      label: 'Skin temperature',
      icon: ICONS.skinTemp,
      tone: 'skin',
      color: 'var(--ink-2)',
      value: d?.skinTemp ? formatDeviation(d.skinTemp.deviationC) : EMPTY,
      note: d?.skinTemp ? 'vs your baseline, overnight' : 'not recorded last night',
    },
  ]
})
</script>
