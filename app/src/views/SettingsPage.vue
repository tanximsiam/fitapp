<template>
  <AppShell title="Profile & settings">
    <div class="grid grid-cols-[minmax(0,1fr)] gap-6">
      <!-- Who and what this app is showing. -->
      <section class="card flex items-center gap-4 p-4" aria-label="Account">
        <span class="grid size-12 shrink-0 place-items-center rounded-full bg-accent-soft text-lg font-semibold text-accent" aria-hidden="true">
          <template v-if="initials">{{ initials }}</template>
          <ion-icon v-else :icon="personOutline" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-[15px] font-semibold">{{ displayName || (mode.isDemo ? 'Guest' : 'Not signed in') }}</span>
          <span class="block truncate text-[13px] text-ink-2">{{ auth.user?.email ?? (mode.isDemo ? 'Viewing sample data' : '') }}</span>
        </span>
        <RouterLink v-if="!auth.user && mode.backendConfigured" to="/login" class="min-h-9 shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-ink">Sign in</RouterLink>
      </section>

      <!-- The watch lives here rather than in the tab bar: checked now and then, not every day. -->
      <section aria-labelledby="device-title">
        <h2 id="device-title" :class="HEADING">Watch & connection</h2>
        <RouterLink to="/home/device" class="card flex items-center gap-3 p-4">
          <span class="relative grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent" aria-hidden="true">
            <ion-icon :icon="watchOutline" class="text-lg" />
            <span class="absolute top-0 right-0 size-2.5 rounded-full ring-2 ring-[var(--surface)]" :class="SYNC_DOT[sync]" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[15px] font-semibold">{{ fitness.status?.sources[0]?.device ?? 'No watch yet' }}</span>
            <span class="block truncate text-[13px] text-ink-2">
              {{ SYNC_LABELS[sync] }}<template v-if="fitness.status?.lastIngestedAt"> · {{ formatRelative(fitness.status.lastIngestedAt) }}</template>
            </span>
          </span>
          <ion-icon :icon="chevronForward" aria-hidden="true" class="shrink-0 text-muted" />
        </RouterLink>
      </section>

      <section v-if="mode.isDemo || auth.user" aria-labelledby="goals-title">
        <h2 id="goals-title" :class="HEADING">Daily goals</h2>
        <div class="card p-4"><GoalsForm /></div>
      </section>

      <section v-if="mode.isDemo || auth.user" aria-labelledby="trackers-title">
        <h2 id="trackers-title" :class="HEADING">Personal trackers</h2>
        <ul class="card divide-y divide-line">
          <li v-for="t in TRACKERS" :key="t.key">
            <ion-toggle :checked="journal.prefs[t.key]" class="toggle" justify="space-between" @ion-change="toggleTracker(t.key, $event.detail.checked)">
              <span class="block py-3 whitespace-normal">
                <span class="block text-[15px] font-medium text-ink">{{ t.label }}</span>
                <span class="block text-[13px] leading-snug text-ink-2">{{ t.hint }}</span>
              </span>
            </ion-toggle>
          </li>
        </ul>
        <p :class="FOOT">Turning a tracker off hides it everywhere; its entries are kept.</p>
        <p v-if="prefsError" role="alert" class="mt-2 px-1 text-sm text-danger">{{ prefsError }}</p>
      </section>

      <section aria-labelledby="appearance-title">
        <h2 id="appearance-title" :class="HEADING">Appearance</h2>
        <div class="card flex items-center justify-between gap-3 p-4">
          <span class="text-[15px] font-medium">Theme</span>
          <ThemeToggle labels />
        </div>
      </section>

      <section v-if="!mode.isDemo && auth.user" aria-labelledby="server-title">
        <h2 id="server-title" :class="HEADING">Data received</h2>
        <div class="card divide-y divide-line">
          <div v-for="s in fitness.status?.sources ?? []" :key="s.key" class="flex items-center justify-between gap-3 p-4">
            <span class="min-w-0">
              <span class="block truncate text-[15px] font-medium">{{ s.name }}</span>
              <span class="block text-[13px] text-ink-2">Last upload {{ formatRelative(s.lastIngestedAt) }}</span>
            </span>
            <span class="shrink-0 text-[13px] text-muted">{{ s.latestDate ? formatShortDate(s.latestDate) : '—' }}</span>
          </div>
          <p v-if="fitness.status && !fitness.status.sources.length" class="p-4 text-sm text-muted">No source has uploaded data yet.</p>
        </div>
        <p :class="FOOT">The watch and apps that have sent data to your account.</p>
      </section>

      <section aria-labelledby="privacy-title">
        <h2 id="privacy-title" :class="HEADING">Privacy & data</h2>
        <div class="card divide-y divide-line">
          <template v-if="mode.isDemo">
            <button type="button" :class="ROW" @click="resetDemo">
              <span class="min-w-0 flex-1">
                <span class="block text-[15px] font-medium" :class="confirmReset ? 'text-danger' : ''">{{ confirmReset ? 'Tap again to start over' : 'Start sample data over' }}</span>
                <span v-if="resetDone" class="block text-[13px] text-ink-2">Done.</span>
              </span>
            </button>
            <button type="button" :class="ROW" @click="showWelcome">
              <span class="block text-[15px] font-medium">Leave sample data</span>
            </button>
          </template>
          <button v-if="!mode.isDemo && auth.user" type="button" :class="ROW" @click="signOut">
            <span class="block text-[15px] font-medium text-danger">Sign out</span>
          </button>
        </div>
        <p :class="FOOT">
          {{
            mode.isDemo
              ? 'Sample data stays on this phone.'
              : 'Your records live on your FitApp server. This phone keeps an encrypted copy for offline use, removed when you sign out.'
          }}
        </p>
      </section>

      <section aria-labelledby="about-title">
        <h2 id="about-title" :class="HEADING">About</h2>
        <div class="card divide-y divide-line text-[15px]">
          <div class="flex justify-between gap-3 p-4"><span>Version</span><span class="tabular text-ink-2">{{ version }}</span></div>
          <a :href="REPO_URL" target="_blank" rel="noopener" class="flex justify-between gap-3 p-4">
            <span>Source code and licences</span><ion-icon :icon="openOutline" aria-hidden="true" class="text-muted" />
          </a>
        </div>
        <p :class="FOOT">Observations in FitApp are associations in your own records, not medical advice.</p>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { alertController, IonIcon, IonToggle } from '@ionic/vue'
import { connection } from '@/data/offline'
import { vault } from '@/lib/vault'
import { forgetAccount } from '@/sources/sync'
import { chevronForward, openOutline, personOutline, watchOutline } from 'ionicons/icons'
import { SYNC_LABELS, syncState } from '@/data/connection'
import { version } from '../../package.json'
import { errorMessage } from '@/api/client'
import AppShell from '@/components/AppShell.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import GoalsForm from '@/components/settings/GoalsForm.vue'
import { demoControls } from '@/data/adapters'
import { resetDemoJournal } from '@/data/demoJournal'
import { formatRelative, formatShortDate } from '@/lib/format'
import { onboarding } from '@/lib/onboarding'
import { sampleProfile } from '@/lib/sampleProfile'
import { useAuthStore } from '@/stores/auth'
import { useFitnessStore } from '@/stores/fitness'
import { useJournalStore } from '@/stores/journal'
import { useModeStore } from '@/stores/mode'
import { resetDataStores } from '@/stores/reset'
import type { TrackerPrefs } from '@/types/journal'

const REPO_URL = 'https://github.com/tanximsiam/fitapp'
const SYNC_DOT = { current: 'bg-[#0ca30c]', delayed: 'bg-[#fab219]', stale: 'bg-danger', none: 'bg-line-strong' } as const
const HEADING = 'mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase'
const FOOT = 'mt-2 px-1 text-xs leading-relaxed text-muted'
const ROW = 'flex min-h-14 w-full items-center gap-3 p-4 text-left'

const mode = useModeStore()
const auth = useAuthStore()
const fitness = useFitnessStore()
const journal = useJournalStore()
const router = useRouter()
const sync = computed(() => syncState(fitness.status))

onMounted(async () => {
  if (mode.isDemo) return fitness.ensureLoaded()
  await auth.init()
  if (auth.user) fitness.ensureLoaded()
})

const displayName = computed(() => auth.user?.name ?? (mode.isDemo ? sampleProfile.name() : null) ?? '')
const initials = computed(() =>
  displayName.value
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

/** Signing out removes everything this account left on the phone: token, profile, cached records and the outbox. */
async function signOut() {
  const unsent = (await mode.offlineJournal?.unsent()) ?? 0
  if (unsent) {
    const alert = await alertController.create({
      header: `${unsent} ${unsent === 1 ? 'entry has' : 'entries have'} not synced`,
      message: 'Signing out deletes them from this phone. Connect to the internet first to keep them.',
      buttons: [{ text: 'Cancel', role: 'cancel' }, { text: 'Sign out anyway', role: 'destructive' }],
    })
    await alert.present()
    if ((await alert.onDidDismiss()).role !== 'destructive') return
  }
  if (auth.user) await forgetAccount(auth.user.id)
  await auth.logout()
  await vault.clear()
  connection.queue = []
  connection.offline = false
  resetDataStores()
  // Signed out: start again from the welcome screen.
  onboarding.reset()
  router.replace('/welcome')
}

function showWelcome() {
  onboarding.reset()
  router.replace('/welcome')
}

const TRACKERS: { key: keyof TrackerPrefs; label: string; hint: string }[] = [
  { key: 'mood', label: 'Mood', hint: 'Check-ins with mood, energy, emotions and stress you felt' },
  { key: 'food', label: 'Food & nutrition', hint: 'Meals with optional nutrition values' },
  { key: 'hydration', label: 'Hydration', hint: 'Water and other drinks' },
  { key: 'cycle', label: 'Periods', hint: 'Period days, flow and symptoms' },
]
const prefsError = ref<string | null>(null)
async function toggleTracker(key: keyof TrackerPrefs, on: boolean) {
  if (journal.prefs[key] === on) return
  prefsError.value = null
  try {
    await journal.savePrefs({ ...journal.prefs, [key]: on })
  } catch (err) {
    prefsError.value = errorMessage(err, 'Could not save the preference.')
  }
}

const confirmReset = ref(false)
const resetDone = ref(false)
async function resetDemo() {
  if (!confirmReset.value) {
    confirmReset.value = true
    resetDone.value = false
    return
  }
  confirmReset.value = false
  demoControls.reset()
  resetDemoJournal()
  resetDataStores()
  await Promise.all([fitness.load(), journal.load()])
  resetDone.value = true
}
</script>

<style scoped>
.toggle {
  --track-background-checked: var(--accent);
  /* Ionic forces content-box on toggles, so fill the row as a block instead of width: 100%. */
  display: block;
  padding: 0 16px;
}
</style>
