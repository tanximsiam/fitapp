<template>
  <!-- FitApp logo from brand/ (design direction 01). Primary colours on light grounds, the white version on dark ones. -->
  <span class="brand-logo inline-flex shrink-0" role="img" aria-label="FitApp">
    <img :src="symbol ? symbolTeal : lockupPrimary" alt="" class="logo-light h-full w-auto" />
    <img :src="symbol ? symbolWhite : lockupWhite" alt="" class="logo-dark h-full w-auto" />
  </span>
</template>

<script setup lang="ts">
import lockupPrimary from '@/assets/brand/fitapp-logo-primary.svg'
import lockupWhite from '@/assets/brand/fitapp-logo-white.svg'
import symbolTeal from '@/assets/brand/fitapp-symbol-teal.svg'
import symbolWhite from '@/assets/brand/fitapp-symbol-white.svg'

/** `symbol` shows the mark alone (for spaces under ~128px wide, per the brand guidelines). */
withDefaults(defineProps<{ symbol?: boolean }>(), { symbol: false })
</script>

<style scoped>
.logo-dark {
  display: none;
}
:root[data-theme='dark'] .logo-light {
  display: none;
}
:root[data-theme='dark'] .logo-dark {
  display: block;
}
</style>
