<template>
  <svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <!-- A rounded 3D emoticon: lit from the top left, with a gloss, eye glints and a soft ground shadow. -->
    <template v-if="kind === 'face'">
      <defs>
        <radialGradient :id="`${uid}-body`" cx="0.36" cy="0.3" r="0.78">
          <stop offset="0" :style="{ stopColor: `color-mix(in srgb, ${color} 45%, white)` }" />
          <stop offset="0.55" :style="{ stopColor: color }" />
          <stop offset="1" :style="{ stopColor: `color-mix(in srgb, ${color} 72%, black)` }" />
        </radialGradient>
        <linearGradient :id="`${uid}-gloss`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff" stop-opacity="0.75" />
          <stop offset="1" stop-color="#fff" stop-opacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="45.2" rx="13" ry="1.8" fill="#000" fill-opacity="0.12" />
      <circle cx="24" cy="23" r="20" :fill="`url(#${uid}-body)`" />
      <ellipse cx="20.5" cy="11.5" rx="10" ry="5.5" :fill="`url(#${uid}-gloss)`" />
      <template v-if="level >= 4">
        <ellipse cx="13" cy="28" rx="3.6" ry="2.2" fill="#ff5d7a" fill-opacity="0.32" />
        <ellipse cx="35" cy="28" rx="3.6" ry="2.2" fill="#ff5d7a" fill-opacity="0.32" />
      </template>
      <template v-if="level === 1">
        <path d="M13 17.5 L19.5 15" :stroke="INK" stroke-width="2" />
        <path d="M35 17.5 L28.5 15" :stroke="INK" stroke-width="2" />
      </template>
      <ellipse cx="17" cy="21" rx="2.4" ry="3.1" :fill="INK" />
      <ellipse cx="31" cy="21" rx="2.4" ry="3.1" :fill="INK" />
      <circle cx="17.8" cy="19.8" r="0.9" fill="#fff" />
      <circle cx="31.8" cy="19.8" r="0.9" fill="#fff" />
      <template v-if="level === 5">
        <path d="M14.5 28 Q24 41.5 33.5 28 Z" :fill="INK" />
        <path d="M19 34.6 Q24 31.6 29 34.6 Q24 38.2 19 34.6 Z" fill="#ff7a8f" />
      </template>
      <path v-else :d="`M15.5 31.5 Q24 ${31.5 + MOUTH[level - 1] * 7} 32.5 31.5`" :stroke="INK" stroke-width="2.6" />
    </template>

    <template v-else-if="kind === 'battery'">
      <rect x="5" y="14" width="34" height="20" rx="4.5" stroke="currentColor" stroke-width="2.5" class="text-ink-2" />
      <rect x="40" y="20" width="4" height="8" rx="1.5" fill="currentColor" class="text-ink-2" />
      <rect v-for="i in level" :key="i" :x="8.5 + (i - 1) * 6" y="17.5" width="4.6" height="13" rx="1.2" :fill="color" />
    </template>

    <template v-else-if="kind === 'gauge'">
      <path v-for="k in 5" :key="k" :d="arc(k - 1)" :stroke="k <= level ? color : 'var(--line-strong)'" stroke-width="6" />
      <line x1="24" y1="32" :x2="needle.x" :y2="needle.y" stroke="currentColor" stroke-width="2.6" class="text-ink" />
      <circle cx="24" cy="32" r="3" fill="currentColor" class="text-ink" />
    </template>

    <template v-else-if="kind === 'drops'">
      <template v-if="level === 0">
        <path :d="DROP" transform="translate(24 26)" stroke="currentColor" stroke-width="2.2" class="text-muted" />
        <line x1="13" y1="38" x2="35" y2="14" stroke="currentColor" stroke-width="2.2" class="text-muted" />
      </template>
      <path v-for="(p, i) in DROPS[level]" v-else :key="i" :d="DROP" :transform="`translate(${p[0]} 27) scale(${p[1]})`" :fill="color" />
    </template>

    <template v-else-if="kind === 'glass'">
      <path :d="glass.water" :fill="color" fill-opacity="0.85" />
      <path :d="glass.outline" stroke="currentColor" stroke-width="2.4" class="text-ink-2" />
    </template>
  </svg>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'

export type GlyphKind = 'face' | 'battery' | 'gauge' | 'drops' | 'glass'
/** level: 1–5 for face, battery and gauge; 0–4 for drops (none → heavy); millilitres for glass. */
const props = defineProps<{ kind: GlyphKind; level: number; color: string }>()

const INK = '#2b2118'
// Gradient ids must be unique per instance; useId can contain colons, which url() references dislike.
const uid = `g${useId().replace(/[^a-z0-9]/gi, '')}`
const MOUTH = [-1, -0.5, 0, 0.55]
const DROP = 'M0 -11 C5 -4 8 0 8 4 A8 8 0 0 1 -8 4 C-8 0 -5 -4 0 -11 Z'
/** [x, scale] per drop for each flow level. */
const DROPS: [number, number][][] = [[], [[24, 0.6]], [[24, 1.05]], [[16, 0.9], [32, 0.9]], [[11, 0.75], [24, 0.9], [37, 0.75]]]

const polar = (deg: number, r: number) => ({ x: 24 + r * Math.cos((deg * Math.PI) / 180), y: 32 - r * Math.sin((deg * Math.PI) / 180) })
function arc(k: number) {
  const a = polar(180 - k * 36 - 3, 17)
  const b = polar(180 - (k + 1) * 36 + 3, 17)
  return `M${a.x.toFixed(2)} ${a.y.toFixed(2)} A17 17 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`
}
const needle = computed(() => polar(180 - (props.level - 0.5) * 36, 13))

/** A tumbler whose height grows with volume, filled to 80%. */
const glass = computed(() => {
  const h = 14 + (Math.min(props.level, 500) / 500) * 24
  const top = 43 - h
  const at = (y: number) => 10 - ((43 - y) / h) * 3.5 // half-width shrinks toward the base
  const water = top + h * 0.2
  const side = (y: number) => [24 - at(y), 24 + at(y)]
  const [l0, r0] = side(top)
  const [lw, rw] = side(water)
  const [lb, rb] = side(43)
  return {
    outline: `M${l0} ${top} L${lb} 43 L${rb} 43 L${r0} ${top}`,
    water: `M${lw} ${water} L${lb} 43 L${rb} 43 L${rw} ${water} Z`,
  }
})
</script>
