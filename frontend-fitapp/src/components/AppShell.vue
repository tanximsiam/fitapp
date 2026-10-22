<template>
  <ion-page>
    <ion-content>
      <div class="flex min-h-full">
        <aside
          id="sidebar"
          class="sticky top-0 z-20 hidden h-dvh shrink-0 flex-col border-r border-line-strong/70 bg-rail py-5 motion-safe:transition-[width] motion-safe:duration-200 lg:flex"
          :class="collapsed ? 'w-[4.5rem] px-3' : 'w-56 px-3'"
        >
          <div class="mb-6 flex items-center pt-1" :class="collapsed ? 'flex-col gap-3' : 'justify-between pl-3'">
            <RouterLink to="/overview" class="flex" aria-label="FitApp overview">
              <BrandLogo :symbol="collapsed" class="h-8" />
            </RouterLink>
            <button
              type="button"
              class="grid size-8 place-items-center rounded-lg text-muted transition-colors duration-150 hover:bg-surface hover:text-ink"
              aria-controls="sidebar"
              :aria-expanded="!collapsed"
              :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
              :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
              @click="toggleSidebar"
            >
              <svg viewBox="0 0 20 20" class="size-[18px]" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <rect x="2.75" y="3.75" width="14.5" height="12.5" rx="2.5" />
                <path d="M7.75 4v12" />
              </svg>
            </button>
          </div>
          <nav aria-label="Sections" class="-mx-3 flex min-h-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto px-3">
            <div v-for="group in groups" :key="group.label" class="flex flex-col gap-0.5">
              <p v-if="!collapsed" class="px-3 pb-1 text-[11px] font-medium uppercase tracking-wide whitespace-nowrap text-muted">{{ group.label }}</p>
              <NavButton v-for="item in group.items" :key="item.to" :to="item.to" :label="item.label" :icon="item.icon" variant="rail" :collapsed="collapsed" />
            </div>
          </nav>
          <div class="pt-4">
            <ProfileMenu :compact="collapsed" placement="up" />
          </div>
        </aside>

        <div class="min-w-0 flex-1 pb-24 lg:pb-10">
          <header class="flex items-center justify-between border-b border-line-strong/70 bg-rail px-4 py-3 lg:hidden">
            <RouterLink to="/overview" class="flex" aria-label="FitApp overview"><BrandLogo class="h-7" /></RouterLink>
            <div class="flex items-center gap-2">
              <WatchStatus v-if="hasData" />
              <ProfileMenu compact placement="down" />
            </div>
          </header>

          <main class="mx-auto w-full max-w-[100rem] px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8 2xl:px-12">
            <div class="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div class="min-w-0">
                <h1 class="text-2xl font-semibold tracking-tight">{{ title }}</h1>
                <p v-if="$slots.subtitle" class="mt-1 text-sm text-muted"><slot name="subtitle" /></p>
              </div>
              <div class="flex items-center gap-3">
                <slot name="actions" />
                <!-- Watch & sync opens from here on every page; on phones the button sits in the header. -->
                <WatchStatus v-if="hasData" class="hidden lg:grid" />
              </div>
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
import { computed, onMounted, ref } from 'vue'
import { IonContent, IonPage } from '@ionic/vue'
import BottomNav from '@/components/BottomNav.vue'
import BrandLogo from '@/components/BrandLogo.vue'
import ProfileMenu from '@/components/ProfileMenu.vue'
import WatchStatus from '@/components/WatchStatus.vue'
import NavButton from '@/components/NavButton.vue'
import { visibleGroups } from '@/components/navItems'
import { useAuthStore } from '@/stores/auth'
import { useJournalStore } from '@/stores/journal'
import { useModeStore } from '@/stores/mode'

defineProps<{ title: string }>()
const journal = useJournalStore()
const mode = useModeStore()
const auth = useAuthStore()
const groups = computed(() => visibleGroups(journal.prefs))
const hasData = computed(() => mode.isDemo || !!auth.user)

/** The sidebar can shrink to an icon rail; the choice is remembered on this device. */
const SIDEBAR_KEY = 'fitapp.sidebar'
const readCollapsed = () => {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === 'collapsed'
  } catch {
    return false
  }
}
const collapsed = ref(readCollapsed())
function toggleSidebar() {
  collapsed.value = !collapsed.value
  try {
    localStorage.setItem(SIDEBAR_KEY, collapsed.value ? 'collapsed' : 'open')
  } catch {
    // Storage unavailable: the choice lasts for this page only.
  }
}

// Tracker preferences drive the navigation, so load them wherever data is readable.
onMounted(() => {
  if (mode.isDemo || auth.user) journal.ensureLoaded()
})
</script>
