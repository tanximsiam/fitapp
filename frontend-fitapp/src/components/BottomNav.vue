<template>
  <nav
    aria-label="Sections"
    class="fixed inset-x-0 bottom-0 z-50 flex border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
  >
    <NavButton v-for="item in MOBILE_NAV" :key="item.to" v-bind="item" variant="bar" />
  </nav>
</template>

<script setup lang="ts">
import NavButton from '@/components/NavButton.vue'
import { MOBILE_NAV } from '@/components/navItems'
</script>
