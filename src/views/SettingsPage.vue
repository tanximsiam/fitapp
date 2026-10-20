<template>
  <AppShell title="Profile & settings">
    <div class="grid grid-cols-[minmax(0,1fr)] gap-6">
      <!-- Who and what this app is showing. -->
      <section class="card flex items-center gap-4 p-4" aria-label="Account">
        <span class="grid size-12 shrink-0 place-items-center rounded-full bg-accent-soft text-lg font-semibold text-accent" aria-hidden="true">
          <template v-if="auth.user">{{ initials }}</template>
          <ion-icon v-else :icon="personOutline" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-[15px] font-semibold">{{ auth.user?.name ?? (mode.isDemo ? 'Demo profile' : 'Not signed in') }}</span>
          <span class="block truncate text-[13px] text-ink-2">{{ auth.user?.email ?? (mode.isDemo ? 'Sample data on this device' : mode.backendUrl) }}</span>
        </span>
        <RouterLink v-if="!mode.isDemo && !auth.user" to="/login" class="min-h-9 shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-ink">Sign in</RouterLink>
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

      <section aria-labelledby="source-title">
        <h2 id="source-title" :class="HEADING">Data source</h2>
        <div class="card divide-y divide-line" role="radiogroup" aria-labelledby="source-title">
          <button v-for="o in sources" :key="o.value" type="button" role="radio" :aria-checked="o.selected" :disabled="o.disabled" class="flex w-full items-center gap-3 p-4 text-left disabled:opacity-50" @click="switchMode(o.value)">
            <span class="min-w-0 flex-1">
              <span class="block text-[15px] font-medium">{{ o.label }}</span>
              <span class="block text-[13px] leading-snug break-words text-ink-2">{{ o.hint }}</span>
            </span>
            <ion-icon v-if="o.selected" :icon="checkmarkCircle" aria-hidden="true" class="shrink-0 text-2xl text-accent" />
          </button>
        </div>
      </section>

      <section v-if="!mode.isDemo && auth.user" aria-labelledby="server-title">
        <h2 id="server-title" :class="HEADING">Server</h2>
        <div class="card divide-y divide-line">
          <div v-for="s in fitness.status?.sources ?? []" :key="s.key" class="flex items-center justify-between gap-3 p-4">
            <span class="min-w-0">
              <span class="block truncate text-[15px] font-medium">{{ s.name }}</span>
              <span class="block text-[13px] text-ink-2">Last upload {{ formatRelative(s.lastIngestedAt) }}</span>
            </span>
            <span class="shrink-0 text-[13px] text-muted">{{ s.latestDate ? formatShortDate(s.latestDate) : '—' }}</span>
          </div>
          <p v-if="fitness.status && !fitness.status.sources.length" class="p-4 text-sm text-muted">No source has uploaded data yet.</p>
          <div class="p-4">
            <h3 class="mb-2 text-[15px] font-medium">Ingest tokens</h3>
            <p class="mb-3 text-[13px] text-ink-2">
              A bridge or exporter uses a token to send device data to your server.
              <a :href="DOCS_URL" target="_blank" rel="noopener" class="font-medium text-accent">Payload format</a>
            </p>
            <IngestTokens />
          </div>
        </div>
        <p :class="FOOT">This lists uploads your server has received. It shows that a source reached FitApp, not that a watch is paired.</p>
      </section>

      <section aria-labelledby="privacy-title">
        <h2 id="privacy-title" :class="HEADING">Privacy & data</h2>
        <div class="card divide-y divide-line">
          <button v-if="mode.isDemo" type="button" :class="ROW" @click="resetDemo">
            <span class="min-w-0 flex-1">
              <span class="block text-[15px] font-medium" :class="confirmReset ? 'text-danger' : ''">{{ confirmReset ? 'Tap again to reset the demo' : 'Reset demo' }}</span>
              <span class="block text-[13px] text-ink-2">{{ resetDone ? 'Restored to the original sample data.' : 'Restores sample data, goals and the simulated watch.' }}</span>
            </span>
          </button>
          <button type="button" :class="ROW" @click="showWelcome">
            <span class="min-w-0 flex-1">
              <span class="block text-[15px] font-medium">Show the welcome screens again</span>
              <span class="block text-[13px] text-ink-2">Choose demo or sign-in and your trackers again.</span>
            </span>
          </button>
          <button v-if="!mode.isDemo && auth.user" type="button" :class="ROW" @click="signOut">
            <span class="block text-[15px] font-medium text-danger">Sign out</span>
          </button>
        </div>
        <p :class="FOOT">
          {{
            mode.isDemo
              ? 'In the demo, everything stays on this device. Nothing is sent anywhere.'
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
import { checkmarkCircle, openOutline, personOutline } from 'ionicons/icons'
import { version } from '../../package.json'
import { errorMessage } from '@/api/client'
import AppShell from '@/components/AppShell.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import GoalsForm from '@/components/settings/GoalsForm.vue'
import IngestTokens from '@/components/settings/IngestTokens.vue'
import { demoControls } from '@/data/adapters'
import { resetDemoJournal } from '@/data/demoJournal'
import { formatRelative, formatShortDate } from '@/lib/format'
import { onboarding } from '@/lib/onboarding'
import { useAuthStore } from '@/stores/auth'
import { useFitnessStore } from '@/stores/fitness'
import { useJournalStore } from '@/stores/journal'
import { useModeStore, type DataMode } from '@/stores/mode'
import { resetDataStores } from '@/stores/reset'
import type { TrackerPrefs } from '@/types/journal'

const DOCS_URL = 'https://github.com/tanximsiam/fitapp/blob/main/docs/integration.md'
const REPO_URL = 'https://github.com/tanximsiam/fitapp-mobile'
const HEADING = 'mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase'
const FOOT = 'mt-2 px-1 text-xs leading-relaxed text-muted'
const ROW = 'flex min-h-14 w-full items-center gap-3 p-4 text-left'

const mode = useModeStore()
const auth = useAuthStore()
const fitness = useFitnessStore()
const journal = useJournalStore()
const router = useRouter()

onMounted(async () => {
  if (mode.isDemo) return fitness.ensureLoaded()
  await auth.init()
  if (auth.user) fitness.ensureLoaded()
})

const initials = computed(() =>
  (auth.user?.name ?? '')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

const sources = computed(() => [
  { value: 'demo' as DataMode, label: 'Sample data', hint: 'A simulated FitApp watch with six months of history. No account needed.', selected: mode.isDemo, disabled: false },
  {
    value: 'backend' as DataMode,
    label: 'Your FitApp server',
    hint: mode.backendConfigured ? mode.backendUrl : 'Not available in this build. Set VITE_BACKEND_URI and rebuild.',
    selected: !mode.isDemo,
    disabled: !mode.backendConfigured,
  },
])

async function switchMode(next: DataMode) {
  if (next === mode.mode) return
  mode.setMode(next)
  resetDataStores()
  if (next === 'backend') {
    await auth.init()
    if (!auth.user) return router.push({ path: '/login', query: { redirect: '/home/settings' } })
  }
  await fitness.load()
}

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
  router.replace('/login')
}

function showWelcome() {
  onboarding.reset()
  router.replace('/welcome')
}

const TRACKERS: { key: keyof TrackerPrefs; label: string; hint: string }[] = [
  { key: 'mood', label: 'Mood', hint: 'Check-ins with mood, energy, emotions and stress you felt' },
  { key: 'food', label: 'Food & water', hint: 'Meals with optional nutrition values, and drinks' },
  { key: 'cycle', label: 'Cycle', hint: 'Period days, flow and symptoms' },
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
