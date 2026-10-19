<template>
  <svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <!-- Mood faces: Microsoft Fluent Emoji, flat style (MIT); see src/assets/mood/LICENSE. -->
    <image v-if="kind === 'face'" :href="MOOD_FACES[level - 1]" x="2" y="2" width="44" height="44" />

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
import { computed } from 'vue'
import mood1 from '@/assets/mood/mood-1.svg'
import mood2 from '@/assets/mood/mood-2.svg'
import mood3 from '@/assets/mood/mood-3.svg'
import mood4 from '@/assets/mood/mood-4.svg'
import mood5 from '@/assets/mood/mood-5.svg'

export type GlyphKind = 'face' | 'battery' | 'gauge' | 'drops' | 'glass'
/** level: 1–5 for face, battery and gauge; 0–4 for drops (none → heavy); millilitres for glass. */
const props = defineProps<{ kind: GlyphKind; level: number; color: string }>()

/** Pensive, slightly frowning, neutral, slightly smiling, grinning. */
const MOOD_FACES = [mood1, mood2, mood3, mood4, mood5]
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
