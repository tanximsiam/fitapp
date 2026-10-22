<template>
  <!-- The Insights hero: the week's health score on a half-circle gauge beside the coach's summary and one tip (as in the mobile app). -->
  <div class="@container/score">
    <section class="hero-panel score-hero flex flex-col gap-6 rounded-3xl p-5 sm:p-7 @3xl/score:flex-row @3xl/score:items-center @3xl/score:gap-12" aria-labelledby="score-title">
      <div class="relative mx-auto w-full max-w-[300px] shrink-0">
        <svg viewBox="-14 0 268 140" class="w-full" role="img" :aria-label="`Health score ${score.score} out of 100, ${score.label}`">
          <path :d="ARC" pathLength="100" fill="none" class="track" stroke-width="6" stroke-linecap="round" />
          <path :d="ARC" pathLength="100" fill="none" class="value" stroke-width="6" stroke-linecap="round" :stroke-dasharray="`${score.score} 100`" />
          <circle :cx="at(score.score).x" :cy="at(score.score).y" r="6" class="knob" />
          <text v-for="t in TICKS" :key="t" :x="at(t, 116).x" :y="at(t, 116).y + 4" class="tick" text-anchor="middle">{{ t }}</text>
        </svg>
        <div class="absolute inset-x-0 bottom-1 text-center">
          <p class="tabular leading-none"><span class="text-[44px] font-semibold tracking-tight">{{ score.score }}</span><span class="text-[17px] text-ink-2">/100</span></p>
          <p class="mt-1.5 flex items-center justify-center gap-1.5 text-[13px] text-ink-2">Health score <span class="size-1.5 rounded-full bg-white" aria-hidden="true" /><span class="font-semibold text-ink">{{ score.label }}</span></p>
        </div>
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-3">
          <span class="grid size-10 shrink-0 place-items-center rounded-full bg-white/15" aria-hidden="true"><ion-icon :icon="sparklesOutline" class="text-lg" /></span>
          <span class="min-w-0">
            <span id="score-title" class="block text-[17px] font-semibold tracking-tight">Health summary</span>
            <span class="block text-[13px] text-ink-2">{{ period }}, explained by your coach</span>
          </span>
        </div>
        <p class="mt-4 max-w-2xl text-lg leading-snug font-semibold tracking-tight" aria-live="polite">{{ coach?.summary ?? '…' }}</p>
        <p v-if="coach" class="mt-4 flex max-w-2xl items-start gap-2 rounded-2xl bg-white/10 px-3.5 py-2.5 text-sm leading-snug">
          <ion-icon :icon="arrowForwardCircleOutline" aria-hidden="true" class="mt-px shrink-0 text-base" />{{ coach.tip }}
        </p>
        <p class="mt-4 max-w-2xl text-xs leading-relaxed text-ink-2">
          Scored against published guidelines: weekly active minutes (WHO), daily steps, 7 to 9 hours of sleep, regular sleep times, resting heart rate and water.
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { arrowForwardCircleOutline, sparklesOutline } from 'ionicons/icons'
import type { AiCoach } from '@/api/ai'
import type { HealthScore } from '@/data/healthScore'

defineProps<{ score: HealthScore; coach: AiCoach | null; period: string }>()

const TICKS = [0, 25, 50, 75, 100]
/** Half circle, left to right, centre (120, 124), radius 96. */
const ARC = 'M 24 124 A 96 96 0 0 1 216 124'
function at(value: number, r = 96) {
  const a = Math.PI * (1 - value / 100)
  return { x: 120 + r * Math.cos(a), y: 124 - r * Math.sin(a) }
}
</script>

<style scoped>
/* White on the teal hero in both themes, over a faint white track (like the overview's goal rings). */
.track {
  stroke: var(--track);
}
.value {
  stroke: #ffffff;
  transition: stroke-dasharray 900ms cubic-bezier(0.23, 1, 0.32, 1);
}
.knob {
  fill: #ffffff;
  stroke: var(--hero);
  stroke-width: 2.5;
}
.tick {
  fill: var(--ink-2);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}
@media (prefers-reduced-motion: reduce) {
  .value {
    transition: none;
  }
}
</style>
