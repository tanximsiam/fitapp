<template>
  <AppShell title="All sections">
    <div class="grid gap-6">
      <section v-for="group in visibleGroups(journal.prefs)" :key="group.label" :aria-label="group.label">
        <h2 class="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{{ group.label }}</h2>
        <ul class="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          <li v-for="item in group.items" :key="item.to">
            <RouterLink :to="item.to" class="flex items-center gap-3 px-4 py-3 text-sm transition-colors duration-150 hover:bg-page">
              <ion-icon :icon="item.icon" aria-hidden="true" class="text-lg text-ink-2" />
              {{ item.label }}
              <ion-icon :icon="chevronForwardOutline" aria-hidden="true" class="ml-auto text-muted" />
            </RouterLink>
          </li>
        </ul>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { chevronForwardOutline } from 'ionicons/icons'
import AppShell from '@/components/AppShell.vue'
import { visibleGroups } from '@/components/navItems'
import { useJournalStore } from '@/stores/journal'

const journal = useJournalStore()
</script>
