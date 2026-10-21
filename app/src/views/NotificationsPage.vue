<template>
  <AppShell title="Notifications">
    <ul v-if="notices.length" class="card divide-y divide-line">
      <li v-for="n in notices" :key="n.id">
        <component :is="n.to ? RouterLink : 'div'" :to="n.to" class="flex items-start gap-3 p-4">
          <span class="grid size-9 shrink-0 place-items-center rounded-full" :class="KIND[n.kind]" aria-hidden="true">
            <ion-icon :icon="n.icon" class="text-lg" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-[15px] font-semibold">{{ n.title }}</span>
            <span class="block text-[13px] leading-snug text-ink-2">{{ n.text }}</span>
          </span>
          <ion-icon v-if="n.to" :icon="chevronForward" aria-hidden="true" class="mt-2.5 shrink-0 text-muted" />
        </component>
      </li>
    </ul>
    <div v-else class="flex flex-col items-center px-6 pt-16 text-center">
      <span class="grid size-14 place-items-center rounded-full bg-accent-soft text-accent" aria-hidden="true">
        <ion-icon :icon="notificationsOutline" class="text-2xl" />
      </span>
      <p class="mt-4 text-[17px] font-semibold">You're all caught up</p>
      <p class="mt-1 text-sm text-ink-2">Sync problems, entries waiting to send and goals you reach show up here.</p>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import { chevronForward, notificationsOutline } from 'ionicons/icons'
import AppShell from '@/components/AppShell.vue'
import { useNotifications, type Notice } from '@/composables/useNotifications'

const KIND: Record<Notice['kind'], string> = {
  attention: 'bg-danger-soft text-danger',
  info: 'bg-accent-soft text-accent',
  good: 'bg-[var(--stress-soft)] text-[var(--stress-ink)]',
}
const { notices } = useNotifications()
</script>
