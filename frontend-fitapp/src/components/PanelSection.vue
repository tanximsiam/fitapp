<template>
  <section class="min-w-0 rounded-xl p-4 sm:p-5" :class="tone ? `tone tone-${tone}` : 'border border-line bg-surface'" :aria-labelledby="id">
    <div class="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 :id="id" class="flex items-center gap-2 text-base font-semibold tracking-tight">
        <span v-if="icon" class="grid size-7 place-items-center rounded-lg" :class="tone ? 'bg-surface/70' : 'bg-page'" aria-hidden="true">
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
 * Two surface roles, used the same way on every page:
 * - coloured (set `tone`): the day's key numbers, tinted in that measurement's hue
 * - bordered (default):    everything else
 */
export type Tone = 'activity' | 'energy' | 'sleep' | 'heart' | 'stress' | 'spo2' | 'skin' | 'mood'

withDefaults(defineProps<{ title: string; tone?: Tone; icon?: string }>(), { tone: undefined, icon: undefined })

const id = `panel-${Math.random().toString(36).slice(2, 8)}`
</script>
