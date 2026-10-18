<template>
  <AppShell title="Settings">
    <template #subtitle>Data source, connection status and goals</template>

    <div class="grid gap-4">
      <PanelSection title="Data source">
        <fieldset>
          <legend class="sr-only">Where FitApp reads data from</legend>
          <div class="grid gap-3 sm:grid-cols-2">
            <label :class="optionClass(mode.isDemo)">
              <input type="radio" name="mode" class="mt-1 accent-[var(--accent)]" :checked="mode.isDemo" @change="switchMode('demo')" />
              <span>
                <span class="block text-sm font-medium">Sample data</span>
                <span class="mt-0.5 block text-xs text-ink-2">30 days generated in this browser. No account, nothing sent anywhere.</span>
              </span>
            </label>
            <label :class="[optionClass(!mode.isDemo), !mode.backendConfigured && 'cursor-not-allowed opacity-60']">
              <input
                type="radio"
                name="mode"
                class="mt-1 accent-[var(--accent)]"
                :checked="!mode.isDemo"
                :disabled="!mode.backendConfigured"
                @change="switchMode('backend')"
              />
              <span>
                <span class="block text-sm font-medium">Your FitApp backend</span>
                <span v-if="mode.backendConfigured" class="mt-0.5 block break-all text-xs text-ink-2">{{ mode.backendUrl }}</span>
                <span v-else class="mt-0.5 block text-xs text-ink-2">
                  Not available in this build. Set <code>VITE_BACKEND_URI</code> and rebuild to use a self-hosted backend.
                </span>
              </span>
            </label>
          </div>
        </fieldset>
      </PanelSection>

      <PanelSection title="Connection status">
        <template v-if="mode.isDemo">
          <dl class="grid gap-4 sm:grid-cols-3">
            <MetricItem label="Source" value="Generated sample data" />
            <MetricItem label="Last generated" :value="formatRelative(fitness.status?.lastIngestedAt ?? null)" />
            <MetricItem label="Watch" value="None" />
          </dl>
          <p class="mt-4 max-w-prose text-sm text-ink-2">
            Everything shown in sample mode is simulated. No device, account or external service is involved.
          </p>
        </template>

        <template v-else>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-sm">
              <template v-if="auth.user">Signed in to your backend as <span class="font-medium">{{ auth.user.email }}</span></template>
              <template v-else>Not signed in. <RouterLink to="/login" class="font-medium text-accent underline underline-offset-2">Sign in</RouterLink></template>
            </p>
            <div v-if="auth.user" class="flex gap-2">
              <PrimaryButton variant="secondary" label="Refresh" @click="fitness.refreshStatus()" />
              <PrimaryButton variant="secondary" label="Sign out" @click="signOut" />
            </div>
          </div>
          <p v-if="auth.error && !auth.user" role="alert" class="mt-3 text-sm text-danger">{{ auth.error }}</p>

          <table v-if="auth.user && fitness.status?.sources.length" class="mt-5 w-full text-left text-sm">
            <thead>
              <tr class="text-xs text-muted">
                <th scope="col" class="py-2 pr-4 font-medium">Source</th>
                <th scope="col" class="py-2 pr-4 font-medium">Last upload</th>
                <th scope="col" class="py-2 font-medium">Latest data</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in fitness.status.sources" :key="s.key" class="border-t border-line">
                <td class="py-2 pr-4">{{ s.name }} <span class="text-xs text-muted">({{ s.key }})</span></td>
                <td class="py-2 pr-4">{{ formatRelative(s.lastIngestedAt) }}</td>
                <td class="py-2">{{ s.latestDate ? formatShortDate(s.latestDate) : '—' }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else-if="auth.user && fitness.status" class="mt-4 text-sm text-muted">No source has uploaded data yet.</p>
          <p class="mt-4 max-w-prose text-xs text-muted">
            This lists uploads your backend has received. It shows that a source reached FitApp, not that a particular watch is
            paired or working.
          </p>
        </template>
      </PanelSection>

      <PanelSection v-if="mode.isDemo || auth.user" id="goals" title="Daily goals">
        <GoalsForm />
      </PanelSection>

      <PanelSection v-if="!mode.isDemo && auth.user" title="Ingest tokens">
        <p class="mb-4 max-w-prose text-sm text-ink-2">
          A bridge or script that exports your device data uses one of these tokens to send it to
          <code class="rounded bg-page px-1 text-xs">POST /api/ingest</code>.
          <a :href="DOCS_URL" target="_blank" rel="noopener" class="font-medium text-accent underline underline-offset-2">Payload format</a>
        </p>
        <IngestTokens />
      </PanelSection>

      <PanelSection title="Integrations">
        <ul class="divide-y divide-line border-y border-line text-sm">
          <li class="flex flex-wrap items-start justify-between gap-2 py-3">
            <div class="max-w-prose">
              <p class="font-medium">Your own source</p>
              <p class="text-ink-2">Any exporter, bridge or script that maps its output to the documented ingestion payload.</p>
            </div>
            <span class="rounded-full border border-line px-2 py-0.5 text-xs text-ink-2">Supported</span>
          </li>
          <li class="flex flex-wrap items-start justify-between gap-2 py-3">
            <div class="max-w-prose">
              <p class="font-medium">Zepp cloud</p>
              <p class="text-ink-2">
                Not built. Official access goes through the Zepp Open Platform and needs approved credentials, which this project
                does not have. Nothing here talks to Zepp.
              </p>
            </div>
            <span class="rounded-full border border-line px-2 py-0.5 text-xs text-muted">Not configured</span>
          </li>
        </ul>
      </PanelSection>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import MetricItem from '@/components/MetricItem.vue'
import PanelSection from '@/components/PanelSection.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import GoalsForm from '@/components/settings/GoalsForm.vue'
import IngestTokens from '@/components/settings/IngestTokens.vue'
import { formatRelative, formatShortDate } from '@/lib/format'
import { useAuthStore } from '@/stores/auth'
import { useFitnessStore } from '@/stores/fitness'
import { useModeStore, type DataMode } from '@/stores/mode'

const DOCS_URL = 'https://github.com/tanximsiam/fitapp/blob/main/docs/integration.md'

const mode = useModeStore()
const auth = useAuthStore()
const fitness = useFitnessStore()
const router = useRouter()

const optionClass = (selected: boolean) => [
  'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors duration-150',
  selected ? 'border-accent bg-accent-soft/50' : 'border-line hover:border-line-strong',
]

async function loadIfReadable() {
  if (mode.isDemo) return fitness.ensureLoaded()
  await auth.init()
  if (auth.user) return fitness.ensureLoaded()
}
onMounted(loadIfReadable)

async function switchMode(next: DataMode) {
  mode.setMode(next)
  fitness.$reset()
  if (next === 'backend') {
    await auth.init()
    if (!auth.user) return router.push({ path: '/login', query: { redirect: '/settings' } })
  }
  await fitness.load()
}

async function signOut() {
  await auth.logout()
  fitness.$reset()
  router.push('/login')
}
</script>
