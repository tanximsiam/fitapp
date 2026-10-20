<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button v-for="t in TABS" :key="t.tab" :tab="t.tab" :href="`/${t.tab}`">
          <ion-icon :icon="t.icon" aria-hidden="true" />
          <ion-label>{{ t.label }}</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>

    <!-- Manual entries belong to Home and Journal; watch pages have nothing to log by hand. -->
    <Transition name="fab">
      <button v-if="showLog" type="button" class="quick-log" aria-label="Quick log: add a mood, meal, drink or cycle day" @click="ui.openQuickLog(LOG_KIND[route.path])">
        <ion-icon :icon="add" aria-hidden="true" />
      </button>
    </Transition>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { IonIcon, IonLabel, IonPage, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/vue'
import { add, bookOutline, bulbOutline, homeOutline, pulseOutline, watchOutline } from 'ionicons/icons'
import { useAuthStore } from '@/stores/auth'
import { useJournalStore } from '@/stores/journal'
import { useModeStore } from '@/stores/mode'
import { useUiStore, type QuickLogView } from '@/stores/ui'

const TABS = [
  { tab: 'home', label: 'Home', icon: homeOutline },
  { tab: 'health', label: 'Health', icon: pulseOutline },
  { tab: 'journal', label: 'Journal', icon: bookOutline },
  { tab: 'insights', label: 'Insights', icon: bulbOutline },
  { tab: 'device', label: 'Device', icon: watchOutline },
]

const route = useRoute()
const ui = useUiStore()
const journal = useJournalStore()
const mode = useModeStore()
const auth = useAuthStore()
/** Where a manual entry fits, and which form the button opens there ('choose' shows all four). */
const LOG_KIND: Record<string, QuickLogView> = {
  '/home': 'choose',
  '/journal': 'choose',
  '/journal/mood': 'mood',
  '/journal/food': 'choose',
  '/journal/cycle': 'cycle',
}
const showLog = computed(() => route.path in LOG_KIND)

// Tracker preferences decide what Home, Journal and Quick log offer.
onMounted(() => {
  if (mode.isDemo || auth.user) journal.ensureLoaded()
})
</script>

<style scoped>
.quick-log {
  position: absolute;
  right: 16px;
  bottom: calc(var(--tabbar-height) + env(safe-area-inset-bottom) + 16px);
  z-index: 20;
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 9999px;
  background: var(--accent);
  color: var(--accent-ink);
  font-size: 28px;
  box-shadow: 0 8px 24px -6px rgb(15 118 110 / 0.55);
  transition: scale 160ms cubic-bezier(0.23, 1, 0.32, 1);
}
.quick-log:active {
  scale: 0.94;
}
:root[data-theme='dark'] .quick-log {
  box-shadow: none;
}
.fab-enter-active,
.fab-leave-active {
  transition:
    opacity 180ms ease-out,
    scale 180ms cubic-bezier(0.23, 1, 0.32, 1);
}
.fab-enter-from,
.fab-leave-to {
  opacity: 0;
  scale: 0.6;
}
</style>
