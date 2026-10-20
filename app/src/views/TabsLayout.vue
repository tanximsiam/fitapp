<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <!-- Icon-only: the name is the accessible label. Outline icons; the selected tab shows its filled icon in teal. -->
        <ion-tab-button v-for="t in TABS" :key="t.tab" :tab="t.tab" :href="`/${t.tab}`" :aria-label="t.label">
          <TabIcon :key="selected(t.tab) ? 'on' : 'off'" :name="t.tab" :filled="selected(t.tab)" />
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>

    <!-- Manual entries belong to Home and Journal; watch pages have nothing to log by hand. -->
    <Transition name="fab">
      <button v-if="showLog" type="button" class="quick-log" aria-label="Quick log: add a mood, meal, drink or period day" @click="ui.openQuickLog(LOG_KIND[route.path])">
        <ion-icon :icon="add" aria-hidden="true" />
      </button>
    </Transition>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { IonIcon, IonPage, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/vue'
import { add } from 'ionicons/icons'
import TabIcon, { type TabIconName } from '@/components/TabIcon.vue'
import { App } from '@capacitor/app'
import { Network } from '@capacitor/network'
import { useAuthStore } from '@/stores/auth'
import { useFitnessStore } from '@/stores/fitness'
import { useJournalStore } from '@/stores/journal'
import { useModeStore } from '@/stores/mode'
import { useUiStore, type QuickLogView } from '@/stores/ui'

const TABS: { tab: TabIconName; label: string }[] = [
  { tab: 'home', label: 'Home' },
  { tab: 'health', label: 'Health' },
  { tab: 'journal', label: 'Journal' },
  { tab: 'insights', label: 'Insights' },
]

const route = useRoute()
/** A tab is selected on its own page and on the pages below it (e.g. /health/sleep). */
const selected = (tab: string) => route.path === `/${tab}` || route.path.startsWith(`/${tab}/`)
const ui = useUiStore()
const journal = useJournalStore()
const fitness = useFitnessStore()
const mode = useModeStore()
const auth = useAuthStore()
/** Where a manual entry fits, and which form the button opens there ('choose' shows all four). */
const LOG_KIND: Record<string, QuickLogView> = {
  '/home': 'choose',
  '/journal': 'choose',
  '/journal/mood': 'mood',
  '/journal/food': 'choose',
  // Not on /journal/cycle: the page edits the selected day in place, and the button would cover the calendar.
}
const showLog = computed(() => route.path in LOG_KIND)

// Tracker preferences decide what Home, Journal and Quick log offer.
onMounted(() => {
  if (mode.isDemo || auth.user) journal.ensureLoaded()
})

/** Back online or back in the app: send queued entries (journal.load flushes first) and refresh. */
async function refresh() {
  if (mode.isDemo || !auth.user) return
  // Bluetooth and health-platform code loads only for a signed-in account, not at start-up.
  const { syncAll, useAccount } = await import('@/sources/sync')
  useAccount(auth.user.id)
  // Phone sources upload first, so the reload below already includes their readings.
  await syncAll()
  fitness.load()
  if (journal.loaded) journal.load()
}
const listeners = [Network.addListener('networkStatusChange', (s) => s.connected && refresh()), App.addListener('resume', refresh)]
onBeforeUnmount(() => listeners.forEach((l) => l.then((h) => h.remove())))
</script>

<style scoped>
.quick-log {
  position: absolute;
  right: 16px;
  /* 16px above the docked tab bar. */
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
