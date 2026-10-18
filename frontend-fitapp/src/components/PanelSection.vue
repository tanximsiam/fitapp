<template>
  <section class="min-w-0 rounded-xl p-4 sm:p-5" :class="tone ? `tone tone-${tone}` : 'border border-line bg-surface'" :aria-labelledby="id">
    <div class="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 :id="id" class="text-base font-semibold tracking-tight">{{ title }}</h2>
      <slot name="aside" />
    </div>
    <slot />
  </section>
</template>

<script setup lang="ts">
/**
 * Two surface roles, used the same way on every page:
 * - coloured (set `tone`): the day's key numbers, tinted in that measurement's hue
 * - bordered (default):    everything else
 * Titles carry no icon; icons belong to the measurements inside.
 */
export type Tone = 'activity' | 'energy' | 'sleep' | 'heart' | 'stress' | 'spo2' | 'skin' | 'mood'

withDefaults(defineProps<{ title: string; tone?: Tone }>(), { tone: undefined })

const id = `panel-${Math.random().toString(36).slice(2, 8)}`
</script>
