<template>
  <!--
    The module summary: a deep shade of the module's own colour with white type, like the overview greeting.
    Values carry icons, goal bars and a 7-day spark so the panel reads at a glance.
  -->
  <section
    class="hero-panel hero-module flex flex-col gap-6 rounded-3xl p-5 sm:p-7 xl:flex-row xl:items-center"
    :style="{ '--hero': `var(--${tone}-deep)` }"
    :aria-label="`${title} summary`"
  >
    <div class="@container min-w-0 flex-1">
      <p class="flex items-center gap-2 text-sm text-ink-2">
        <span class="grid size-7 place-items-center rounded-full bg-[var(--chip)]" aria-hidden="true"><ion-icon :icon="icon" class="text-base" /></span>
        {{ eyebrow }}
      </p>
      <div class="mt-3 flex flex-wrap items-end gap-x-6 gap-y-3">
        <p class="flex flex-wrap items-baseline gap-x-2.5">
          <span class="tabular text-[clamp(1.875rem,1.25rem+2.2cqi,2.75rem)] leading-none font-semibold tracking-tight">{{ headline }}</span>
          <span v-if="headlineUnit" class="text-base font-medium text-ink-2">{{ headlineUnit }}</span>
        </p>
        <!-- Last 7 days of the headline measure, today brightest. -->
        <div v-if="spark?.length" class="flex h-10 items-end gap-1" role="img" :aria-label="sparkLabel">
          <span
            v-for="(v, i) in spark"
            :key="i"
            class="w-2.5 rounded-full"
            :class="v == null ? 'h-1 bg-[var(--chip)]' : ''"
            :style="v == null ? undefined : { height: `${Math.max(12, (v / sparkMax) * 100)}%`, background: i === spark.length - 1 ? '#ffffff' : 'rgb(255 255 255 / 0.45)' }"
          />
        </div>
      </div>
      <div v-if="headlineRatio != null" class="mt-3 max-w-sm">
        <div class="h-2 overflow-hidden rounded-full bg-[var(--chip)]" aria-hidden="true">
          <div class="h-full rounded-full bg-white transition-[width] duration-700 ease-out" :style="{ width: `${Math.min(100, headlineRatio * 100)}%` }" />
        </div>
      </div>
      <p v-if="sentence" class="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-2">{{ sentence }}</p>
      <div v-if="$slots.actions" class="mt-4 flex flex-wrap items-center gap-2"><slot name="actions" /></div>
    </div>

    <dl class="grid shrink-0 grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4 xl:w-[36rem]">
      <div v-for="s in stats" :key="s.label" class="min-w-0">
        <dt class="flex items-center gap-1.5 text-xs text-ink-2">
          <ion-icon v-if="s.icon" :icon="s.icon" aria-hidden="true" class="shrink-0 text-sm" />
          <span class="truncate">{{ s.label }}</span>
        </dt>
        <dd class="tabular mt-1 truncate text-xl font-semibold tracking-tight">{{ s.value }}</dd>
        <dd v-if="s.ratio != null" class="mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--chip)]" aria-hidden="true">
          <div class="h-full rounded-full bg-white" :style="{ width: `${Math.min(100, s.ratio * 100)}%` }" />
        </dd>
        <dd v-if="s.note" class="mt-1 truncate text-xs text-muted">{{ s.note }}</dd>
      </div>
    </dl>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'

export type HeroTone = 'activity' | 'energy' | 'sleep' | 'heart' | 'stress' | 'spo2' | 'skin' | 'mood' | 'cycle'

export interface HeroStat {
  label: string
  value: string
  icon?: string
  /** Progress toward a goal (0–1+), drawn as a thin bar under the value. */
  ratio?: number | null
  note?: string
}

const props = withDefaults(
  defineProps<{
    title: string
    tone: HeroTone
    icon: string
    eyebrow: string
    headline: string
    headlineUnit?: string
    /** Progress of the headline value toward its goal. */
    headlineRatio?: number | null
    /** Up to 7 recent values of the headline measure, oldest first; null = not measured. */
    spark?: (number | null)[]
    sparkLabel?: string
    sentence?: string
    stats: HeroStat[]
  }>(),
  { headlineUnit: undefined, headlineRatio: undefined, spark: undefined, sparkLabel: '', sentence: undefined },
)
const sparkMax = computed(() => Math.max(1, ...(props.spark ?? []).map((v) => v ?? 0)))
</script>
