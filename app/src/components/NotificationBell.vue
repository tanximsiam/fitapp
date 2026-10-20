<template>
  <RouterLink
    to="/home/notifications"
    class="relative grid size-9 place-items-center rounded-full bg-surface text-ink-2 shadow-[var(--card-shadow)]"
    :aria-label="needsAttention ? 'Notifications, something needs your attention' : 'Notifications'"
  >
    <ion-icon :icon="notificationsOutline" aria-hidden="true" class="text-lg" />
    <span v-if="needsAttention" class="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-danger ring-2 ring-[var(--page)]" aria-hidden="true" />
  </RouterLink>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { notificationsOutline } from 'ionicons/icons'
import { useNotifications } from '@/composables/useNotifications'

const { needsAttention } = useNotifications()
</script>
