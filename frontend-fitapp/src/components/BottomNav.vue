<template>
  <nav
    aria-label="Sections"
    class="fixed inset-x-0 bottom-0 z-50 flex border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
  >
    <template v-for="item in MOBILE_NAV" :key="item.label">
      <NavButton v-if="item.to" :to="item.to" :label="item.label" :icon="item.icon" variant="bar" />
      <button v-else type="button" class="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-accent" @click="ui.openQuickLog()">
        <ion-icon :icon="item.icon" aria-hidden="true" class="text-[26px]" />
        <span class="text-[11px] leading-none font-medium">Quick log</span>
      </button>
    </template>
  </nav>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import NavButton from '@/components/NavButton.vue'
import { MOBILE_NAV } from '@/components/navItems'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
</script>
