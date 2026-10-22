<template>
  <!-- The account at the foot of the sidebar, as in chat apps: who is signed in, the theme, settings and sign in or out. -->
  <div ref="root" class="relative" @keydown.esc="open && close(true)">
    <button
      ref="trigger"
      type="button"
      class="flex w-full items-center gap-2.5 rounded-full p-1 text-left transition-colors duration-150 hover:bg-surface"
      :class="compact ? 'justify-center' : 'pr-3'"
      aria-haspopup="true"
      :aria-expanded="open"
      :aria-label="compact ? `Account: ${name}` : undefined"
      :title="compact ? name : undefined"
      @click="open = !open"
    >
      <span class="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-ink" aria-hidden="true">{{ initials }}</span>
      <span v-if="!compact" class="min-w-0 flex-1">
        <span class="block truncate text-sm font-medium">{{ name }}</span>
        <span class="block truncate text-xs text-muted">{{ detail }}</span>
      </span>
      <ion-icon v-if="!compact" :icon="ellipsisHorizontal" aria-hidden="true" class="shrink-0 text-muted" />
    </button>

    <Transition name="pop">
      <div
        v-if="open"
        class="card absolute z-50 w-72 p-2"
        :class="placement === 'up' ? 'bottom-full left-0 mb-2 origin-bottom-left' : 'top-full right-0 mt-2 origin-top-right'"
      >
        <div class="px-2.5 pt-1.5 pb-2.5">
          <p class="truncate text-sm font-semibold">{{ name }}</p>
          <p class="truncate text-xs text-muted">{{ detail }}</p>
        </div>
        <div class="border-t border-line px-2.5 py-2.5">
          <p class="mb-1.5 text-xs text-muted">Theme</p>
          <ThemeToggle labels />
        </div>
        <div class="flex flex-col border-t border-line pt-1.5">
          <RouterLink to="/settings" :class="item" @click="close()"><ion-icon :icon="settingsOutline" aria-hidden="true" class="text-base" />Settings</RouterLink>
          <button type="button" :class="item" @click="signOut"><ion-icon :icon="logOutOutline" aria-hidden="true" class="text-base" />Sign out</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import { ellipsisHorizontal, logOutOutline, settingsOutline } from 'ionicons/icons'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useAuthStore } from '@/stores/auth'
import { useModeStore } from '@/stores/mode'
import { resetDataStores } from '@/stores/reset'

/** compact: the avatar alone (collapsed sidebar, phone header). placement: which way the panel opens. */
withDefaults(defineProps<{ compact?: boolean; placement?: 'up' | 'down' }>(), { compact: false, placement: 'up' })

const auth = useAuthStore()
const mode = useModeStore()
const router = useRouter()
const route = useRoute()

// The browser-only account reads like a real one (example.com is reserved for examples).
const name = computed(() => (mode.isDemo ? 'Maya Chen' : auth.user?.name ?? 'Not signed in'))
const detail = computed(() => (mode.isDemo ? 'maya.chen@example.com' : auth.user?.email ?? 'Sign in to see your data'))
const initials = computed(() =>
  name.value
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join(''),
)

const item = 'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-2 transition-colors duration-150 hover:bg-[var(--page)] hover:text-ink'

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)

function close(refocus = false) {
  open.value = false
  if (refocus) trigger.value?.focus()
}
function onPointerDown(e: PointerEvent) {
  if (!root.value?.contains(e.target as Node)) close()
}
watch(open, (isOpen) => (isOpen ? document.addEventListener('pointerdown', onPointerDown) : document.removeEventListener('pointerdown', onPointerDown)))
watch(() => route.fullPath, () => close())
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown))

async function signOut() {
  close()
  // Sample data signs out like an account: back to the sign-in page.
  if (mode.isDemo) mode.leave()
  else await auth.logout()
  resetDataStores()
  router.push('/login')
}
</script>

<style scoped>
.pop-enter-active {
  transition:
    opacity 150ms ease-out,
    scale 150ms cubic-bezier(0.23, 1, 0.32, 1);
}
.pop-leave-active {
  transition: opacity 100ms ease-in;
}
.pop-enter-from {
  opacity: 0;
  scale: 0.96;
}
.pop-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .pop-enter-active {
    transition: opacity 150ms ease-out;
  }
  .pop-enter-from {
    scale: 1;
  }
}
</style>
