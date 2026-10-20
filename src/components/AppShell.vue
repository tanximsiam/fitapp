<template>
  <!--
    Mobile page frame. Same slots as the web shell (title, subtitle, actions, default), so module pages are shared.
    Tab roots get a large title with the data-mode badge and profile; pages below a tab get a back button.
  -->
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons v-if="parent" slot="start">
          <ion-back-button :default-href="parent" text="" />
        </ion-buttons>
        <ion-title v-if="parent">{{ title }}</ion-title>
        <BrandLogo v-else slot="start" symbol class="ml-4 h-6" />
        <ion-buttons slot="end" class="mr-2 gap-2">
          <DataModeBadge v-if="!parent" />
          <WatchStatus v-if="!parent && route.path !== '/device'" />
          <RouterLink
            v-if="!parent"
            to="/home/settings"
            class="grid size-9 place-items-center rounded-full bg-surface text-ink-2 shadow-[var(--card-shadow)]"
            aria-label="Profile and settings"
          >
            <ion-icon :icon="personOutline" aria-hidden="true" class="text-lg" />
          </RouterLink>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ion-refresh="refresh">
        <ion-refresher-content />
      </ion-refresher>
      <main class="mx-auto w-full max-w-2xl px-4 pt-1" :class="parent ? 'pb-10' : 'pb-28'">
        <div class="mb-4">
          <h1 v-if="!parent" class="text-[28px] leading-tight font-semibold tracking-tight">{{ title }}</h1>
          <p v-if="$slots.subtitle" class="mt-0.5 text-sm text-muted"><slot name="subtitle" /></p>
          <div v-if="$slots.actions" class="mt-3"><slot name="actions" /></div>
        </div>
        <OfflineBanner />
        <slot />
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { IonBackButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonRefresher, IonRefresherContent, IonTitle, IonToolbar } from '@ionic/vue'
import type { RefresherCustomEvent } from '@ionic/vue'
import { personOutline } from 'ionicons/icons'
import BrandLogo from '@/components/BrandLogo.vue'
import DataModeBadge from '@/components/DataModeBadge.vue'
import WatchStatus from '@/components/WatchStatus.vue'
import OfflineBanner from '@/components/OfflineBanner.vue'
import { useFitnessStore } from '@/stores/fitness'
import { useJournalStore } from '@/stores/journal'

defineProps<{ title: string }>()
const route = useRoute()
const fitness = useFitnessStore()
const journal = useJournalStore()

/** "/health/sleep" → "/health"; tab roots ("/home") have no parent. */
const parent = computed(() => {
  const i = route.path.lastIndexOf('/')
  return i > 0 ? route.path.slice(0, i) : null
})

async function refresh(e: RefresherCustomEvent) {
  await Promise.all([fitness.refreshStatus(), fitness.load(), journal.loaded ? journal.load() : undefined])
  e.target.complete()
}
</script>
