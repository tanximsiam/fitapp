<template>
  <section class="min-w-0" :class="CLASSES[variant] + (tone ? ` tone tone-${tone}` : '')" :aria-labelledby="id">
    <div class="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 :id="id" class="flex items-center gap-2 text-base font-semibold tracking-tight">
        <span v-if="icon" class="grid size-7 place-items-center rounded-lg" :class="tone ? 'bg-raised/70' : 'bg-page'" aria-hidden="true">
          <ion-icon :icon="icon" class="text-base" :style="{ color: tone ? 'var(--tone-ink)' : 'var(--ink-2)' }" />
        </span>
        {{ title }}
      </h2>
      <slot name="aside" />
    </div>
    <slot />
  </section>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'

/**
 * Surface roles, used consistently across pages:
 * - bordered: charts and reference panels
 * - elevated: analysis and personal summaries (shadow, no border)
 * - tinted:   the day's key numbers, in the page's colour (set `tone`)
 * - plain:    secondary detail, no container
 */
export type PanelVariant = 'bordered' | 'elevated' | 'tinted' | 'plain'
export type Tone = 'activity' | 'energy' | 'sleep' | 'heart' | 'stress' | 'spo2' | 'skin' | 'mood'

withDefaults(defineProps<{ title: string; variant?: PanelVariant; tone?: Tone; icon?: string }>(), {
  variant: 'bordered',
  tone: undefined,
  icon: undefined,
})

const CLASSES: Record<PanelVariant, string> = {
  bordered: 'rounded-xl border border-line bg-surface p-4 sm:p-5',
  elevated: 'rounded-2xl bg-raised p-5 shadow-raised sm:p-6',
  tinted: 'rounded-2xl p-5 sm:p-6',
  plain: 'border-t border-line pt-5',
}
const id = `panel-${Math.random().toString(36).slice(2, 8)}`
</script>
