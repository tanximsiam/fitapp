<template>
  <ion-page>
    <ion-content>
      <div class="flex min-h-full">
        <aside class="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col overflow-y-auto border-r border-line-strong/70 bg-rail px-3 py-5 lg:flex">
          <RouterLink to="/overview" class="mb-5 flex items-center gap-2 px-3 text-[15px] font-semibold tracking-tight">
            <span class="grid size-6 place-items-center rounded-md bg-accent text-[11px] font-bold text-accent-ink" aria-hidden="true">F</span>
            FitApp
          </RouterLink>
          <button
            type="button"
            class="mx-1 mb-5 flex items-center justify-center gap-2 rounded-full bg-accent px-3 py-2 text-sm font-medium text-accent-ink transition-[opacity,scale] duration-150 hover:opacity-90 active:scale-[0.97]"
            @click="ui.openQuickLog()"
          >
            <ion-icon :icon="addOutline" aria-hidden="true" class="text-lg" />Quick log
          </button>
          <nav aria-label="Sections" class="flex flex-col gap-5">
            <div v-for="group in groups" :key="group.label" class="flex flex-col gap-0.5">
              <p class="px-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted">{{ group.label }}</p>
              <NavButton v-for="item in group.items" :key="item.to" :to="item.to" :label="item.label" :icon="item.icon" variant="rail" />
            </div>
          </nav>
          <div class="mt-auto flex flex-col items-start gap-3 px-3 pt-4">
            <ThemeToggle />
            <DataModeBadge />
          </div>
        </aside>

        <div class="min-w-0 flex-1 pb-24 lg:pb-10">
          <header class="flex items-center justify-between border-b border-line-strong/70 bg-rail px-4 py-3 lg:hidden">
            <span class="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
              <span class="grid size-6 place-items-center rounded-md bg-accent text-[11px] font-bold text-accent-ink" aria-hidden="true">F</span>
              FitApp
            </span>
            <div class="flex items-center gap-2">
              <ThemeToggle />
              <DataModeBadge />
            </div>
          </header>

          <main class="mx-auto w-full max-w-[100rem] px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8 2xl:px-12">
            <div class="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div class="min-w-0">
                <h1 class="text-2xl font-semibold tracking-tight">{{ title }}</h1>
                <p v-if="$slots.subtitle" class="mt-1 text-sm text-muted"><slot name="subtitle" /></p>
              </div>
              <slot name="actions" />
            </div>
            <slot />
          </main>
        </div>
      </div>
      <BottomNav slot="fixed" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { IonContent, IonIcon, IonPage } from '@ionic/vue'
import { addOutline } from 'ionicons/icons'
import BottomNav from '@/components/BottomNav.vue'
import DataModeBadge from '@/components/DataModeBadge.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import NavButton from '@/components/NavButton.vue'
import { visibleGroups } from '@/components/navItems'
import { useAuthStore } from '@/stores/auth'
import { useJournalStore } from '@/stores/journal'
import { useModeStore } from '@/stores/mode'
import { useUiStore } from '@/stores/ui'

defineProps<{ title: string }>()
const ui = useUiStore()
const journal = useJournalStore()
const mode = useModeStore()
const auth = useAuthStore()
const groups = computed(() => visibleGroups(journal.prefs))

// Tracker preferences drive the navigation, so load them wherever data is readable.
onMounted(() => {
  if (mode.isDemo || auth.user) journal.ensureLoaded()
})
</script>
