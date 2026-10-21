<template>
  <!--
    Small generic watch drawings that hint at each family's shape (round with pushers, rounded square with a crown,
    rotating bezel, domed, five buttons, band). Original artwork, no brand logos or trademarked watch faces.
  -->
  <svg viewBox="0 0 64 64" aria-hidden="true" class="dial">
    <!-- Strap -->
    <rect v-if="kind === 'other'" x="24" y="2" width="16" height="60" rx="8" class="strap" />
    <rect v-else x="22" y="2" width="20" height="60" rx="6" class="strap" :class="{ brand: kind === 'fitapp' }" />

    <template v-if="kind === 'apple'">
      <rect x="47" y="24" width="4" height="8" rx="2" class="case" />
      <rect x="47.5" y="35" width="2.5" height="6" rx="1.25" class="case" />
      <rect x="15" y="13" width="33" height="38" rx="11" class="case" />
      <rect x="18" y="16" width="27" height="32" rx="8" class="screen" />
      <text x="31.5" y="35" class="time">10:09</text>
      <path d="M24 42h15" class="arc" />
    </template>

    <template v-else-if="kind === 'other'">
      <rect x="22" y="14" width="20" height="36" rx="10" class="case" />
      <rect x="25" y="18" width="14" height="28" rx="7" class="screen" />
      <text x="32" y="34.5" class="time small">10:09</text>
      <path d="M28 40h8" class="arc" />
    </template>

    <template v-else>
      <!-- Pushers -->
      <template v-if="kind === 'garmin'">
        <rect x="10" y="22" width="4" height="5" rx="1.5" class="case" />
        <rect x="9" y="30" width="4" height="5" rx="1.5" class="case" />
        <rect x="10" y="38" width="4" height="5" rx="1.5" class="case" />
        <rect x="50" y="24" width="4" height="5" rx="1.5" class="case" />
        <rect x="50" y="36" width="4" height="5" rx="1.5" class="case" />
      </template>
      <rect v-else-if="kind === 'google' || kind === 'fitapp'" x="49.5" y="28" width="4.5" height="8" rx="2.25" class="case" />
      <template v-else>
        <rect x="50" y="23" width="4" height="6" rx="2" class="case" />
        <rect x="50" y="35" width="4" height="6" rx="2" class="case" />
      </template>

      <circle cx="32" cy="32" :r="kind === 'google' ? 19 : 21" class="case" />
      <!-- Rotating bezel with ticks -->
      <template v-if="kind === 'samsung'">
        <circle cx="32" cy="32" r="19" class="bezel" />
        <line v-for="i in 12" :key="i" x1="32" y1="14.5" x2="32" y2="16.5" class="tick" :transform="`rotate(${i * 30} 32 32)`" />
      </template>
      <circle cx="32" cy="32" :r="kind === 'google' ? 17 : kind === 'samsung' ? 15 : kind === 'garmin' ? 16 : 18" class="screen" />
      <text x="32" y="34.5" class="time">10:09</text>
      <!-- A progress arc on the dial, in the app's accent -->
      <path d="M24 39a10 10 0 0 0 16 0" class="arc" />
      <line v-if="kind === 'garmin'" x1="24" y1="26" x2="40" y2="26" class="field" />
    </template>
  </svg>
</template>

<script setup lang="ts">
import type { WearableBrand } from '@/types/auth'

defineProps<{ kind: Exclude<WearableBrand, 'none'> }>()
</script>

<style scoped>
.dial {
  --case: color-mix(in srgb, var(--ink) 78%, var(--surface));
  --strap: color-mix(in srgb, var(--ink) 22%, var(--surface));
}
.strap {
  fill: var(--strap);
}
/* FitApp's own watch wears the brand teal. */
.strap.brand {
  fill: var(--accent);
}
.case {
  fill: var(--case);
}
.bezel {
  fill: none;
  stroke: color-mix(in srgb, var(--case) 70%, #000);
  stroke-width: 3;
}
.tick {
  stroke: #ffffff;
  stroke-width: 1;
  stroke-linecap: round;
  opacity: 0.7;
}
/* Watch screens are dark in both themes, like the real thing. */
.screen {
  fill: #101214;
}
.time {
  fill: #ffffff;
  font-family: var(--font-sans);
  font-size: 7.5px;
  font-weight: 600;
  text-anchor: middle;
  font-variant-numeric: tabular-nums;
}
.time.small {
  font-size: 6px;
}
.arc,
.field {
  fill: none;
  stroke: #2dd4bf;
  stroke-width: 2;
  stroke-linecap: round;
}
.field {
  stroke: #ffffff;
  opacity: 0.35;
  stroke-width: 1.5;
}
</style>
