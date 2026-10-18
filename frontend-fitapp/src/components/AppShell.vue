<template>
  <ion-page>
    <ion-content>
      <div class="flex min-h-full">
        <aside class="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-line bg-rail px-3 py-5 lg:flex">
          <RouterLink to="/overview" class="mb-6 flex items-center gap-2 px-3 text-[15px] font-semibold tracking-tight">
            <span class="grid size-6 place-items-center rounded-md bg-accent text-[11px] font-bold text-accent-ink" aria-hidden="true">F</span>
            FitApp
          </RouterLink>
          <nav aria-label="Sections" class="flex flex-col gap-5">
            <div v-for="group in NAV_GROUPS" :key="group.label" class="flex flex-col gap-0.5">
              <p class="px-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted">{{ group.label }}</p>
              <NavButton v-for="item in group.items" :key="item.to" v-bind="item" variant="rail" />
            </div>
          </nav>
          <div class="mt-auto px-3"><DataModeBadge /></div>
        </aside>

        <div class="min-w-0 flex-1 pb-24 lg:pb-10">
          <header class="flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
            <span class="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
              <span class="grid size-6 place-items-center rounded-md bg-accent text-[11px] font-bold text-accent-ink" aria-hidden="true">F</span>
              FitApp
            </span>
            <DataModeBadge />
          </header>

          <main class="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 lg:px-10 lg:pt-10">
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
import { IonContent, IonPage } from '@ionic/vue'
import BottomNav from '@/components/BottomNav.vue'
import DataModeBadge from '@/components/DataModeBadge.vue'
import NavButton from '@/components/NavButton.vue'
import { NAV_GROUPS } from '@/components/navItems'

defineProps<{ title: string }>()
</script>
