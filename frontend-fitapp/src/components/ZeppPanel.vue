<template>
  <PanelSection title="Zepp account">
    <template #aside>
      <span class="rounded-full border px-2 py-0.5 text-xs font-medium" :class="badge.cls">{{ badge.text }}</span>
    </template>

    <p v-if="notice" :role="notice.ok ? 'status' : 'alert'" class="mb-4 rounded-lg border px-3 py-2 text-sm" :class="notice.ok ? 'border-line bg-page text-ink' : 'border-danger/30 bg-danger-soft text-danger'">
      {{ notice.text }}
    </p>

    <!-- Demo: explain what the real flow looks like; nothing here contacts Zepp. -->
    <template v-if="mode.isDemo">
      <p class="max-w-prose text-sm text-ink-2">
        In this demo the watch is simulated. On your own FitApp server with Zepp Open Platform credentials, this is where you connect
        your Zepp account. Zepp then sends your daily activity, sleep and workouts to FitApp automatically, and heart rate is pulled
        every 30 minutes.
      </p>
      <ol class="mt-3 list-decimal space-y-1 pl-5 text-sm text-ink-2">
        <li>Get partner access and a client ID and secret from the Zepp Developer Console.</li>
        <li>Put them in the backend <code class="text-xs">.env</code> and register FitApp's callback and webhook URLs with Zepp.</li>
        <li>Sign in to your FitApp and choose <span class="font-medium">Connect Zepp account</span>.</li>
      </ol>
      <div class="mt-4 flex flex-wrap items-center gap-3">
        <PrimaryButton label="Connect Zepp account" disabled />
        <a :href="DOCS" target="_blank" rel="noopener" class="text-sm font-medium text-accent underline underline-offset-2">Zepp setup guide</a>
      </div>
    </template>

    <p v-else-if="loading && !status" class="text-sm text-muted" role="status">Checking Zepp configuration…</p>
    <StatePanel v-else-if="error && !status" kind="error" title="Zepp status could not be loaded">
      {{ error }}
      <template #actions><PrimaryButton variant="secondary" label="Try again" @click="load" /></template>
    </StatePanel>

    <template v-else-if="status && !status.configured">
      <p class="max-w-prose text-sm text-ink-2">
        Zepp is not set up on this server yet. Add your Zepp Open Platform credentials to the backend <code class="text-xs">.env</code>
        and restart it:
      </p>
      <ul class="mt-2 flex flex-wrap gap-1.5">
        <li v-for="v in status.requiredEnv" :key="v"><code class="rounded bg-page px-1.5 py-0.5 text-xs">{{ v }}</code></li>
      </ul>
      <dl class="mt-4 grid gap-3 text-sm">
        <div>
          <dt class="text-xs text-muted">Register as OAuth callback URL</dt>
          <dd class="break-all"><code class="text-xs">{{ status.redirectUri }}</code></dd>
        </div>
        <div>
          <dt class="text-xs text-muted">Register as event webhook URL</dt>
          <dd class="break-all"><code class="text-xs">{{ status.webhookUrl }}</code></dd>
        </div>
      </dl>
      <a :href="DOCS" target="_blank" rel="noopener" class="mt-4 inline-block text-sm font-medium text-accent underline underline-offset-2">Zepp setup guide</a>
    </template>

    <template v-else-if="status && (!status.connection || status.connection.status !== 'connected')">
      <p class="max-w-prose text-sm text-ink-2">
        You'll sign in on Zepp's site and allow FitApp to read your data. Tokens stay on your FitApp server.
        <template v-if="status.connection?.status === 'revoked'"> Access was revoked earlier; data already received is kept.</template>
      </p>
      <PrimaryButton class="mt-4" :label="busy ? 'Opening Zepp…' : 'Connect Zepp account'" :disabled="busy" @click="connect" />
    </template>

    <template v-else-if="status?.connection">
      <dl class="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        <MetricItem label="Zepp user" :value="status.connection.zeppUserId" />
        <MetricItem label="Connected" :value="formatRelative(status.connection.connectedAt)" />
        <MetricItem label="Last event from Zepp" :value="formatRelative(status.connection.lastEventAt)" />
        <MetricItem label="Last heart-rate pull" :value="formatRelative(status.connection.lastSyncAt)" />
      </dl>
      <p v-if="status.connection.lastError" role="alert" class="mt-4 text-sm text-danger">{{ status.connection.lastError }}</p>
      <p class="mt-4 max-w-prose text-xs text-muted">
        Daily activity, sleep and workouts arrive when Zepp sends them after your watch syncs with the Zepp app. A connected account
        means FitApp is authorised; it does not mean the watch itself is currently syncing.
      </p>
      <div class="mt-4 flex flex-wrap gap-2">
        <PrimaryButton variant="secondary" :label="busy ? 'Requesting…' : 'Request last 30 days of history'" :disabled="busy" @click="backfill" />
        <PrimaryButton variant="secondary" :label="confirmDisconnect ? 'Click again to disconnect' : 'Disconnect'" :disabled="busy" @click="disconnect" />
      </div>
    </template>

    <p v-if="!mode.isDemo" class="mt-4 text-xs text-muted">
      Built to Zepp's published Open Platform documentation. Not yet verified against a live Zepp account.
    </p>
  </PanelSection>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MetricItem from '@/components/MetricItem.vue'
import PanelSection from '@/components/PanelSection.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import StatePanel from '@/components/StatePanel.vue'
import { errorMessage } from '@/api/client'
import { disconnectZepp, getZeppStatus, requestZeppBackfill, startZeppConnect, type ZeppStatus } from '@/api/zepp'
import { formatRelative } from '@/lib/format'
import { useFitnessStore } from '@/stores/fitness'
import { useModeStore } from '@/stores/mode'

const DOCS = 'https://github.com/tanximsiam/fitapp/blob/main/docs/zepp.md'
const REASONS: Record<string, string> = {
  denied: 'You declined access on Zepp. Nothing was connected.',
  'invalid-state': 'The connection request expired or did not come from this site. Please try again.',
  'exchange-failed': 'Zepp did not accept the authorisation. Check the client ID, secret and callback URL on the server.',
  'already-linked': 'This Zepp account is already connected to another FitApp user.',
  'no-user': 'Zepp did not return a user ID.',
  'no-code': 'Zepp returned without an authorisation code.',
}

const mode = useModeStore()
const fitness = useFitnessStore()
const route = useRoute()
const router = useRouter()
const status = ref<ZeppStatus | null>(null)
const loading = ref(false)
const busy = ref(false)
const error = ref<string | null>(null)
const notice = ref<{ ok: boolean; text: string } | null>(null)
const confirmDisconnect = ref(false)

const badge = computed(() => {
  if (mode.isDemo) return { text: 'Simulated in demo', cls: 'border-line text-muted' }
  if (!status.value) return { text: '…', cls: 'border-line text-muted' }
  if (!status.value.configured) return { text: 'Not configured', cls: 'border-line text-muted' }
  if (status.value.connection?.status === 'connected') return { text: 'Connected', cls: 'border-activity/40 text-activity' }
  return { text: 'Not connected', cls: 'border-line-strong text-ink-2' }
})

async function load() {
  loading.value = true
  error.value = null
  try {
    status.value = await getZeppStatus()
  } catch (err) {
    error.value = errorMessage(err, 'Could not load Zepp status.')
  } finally {
    loading.value = false
  }
}

async function run(action: () => Promise<void>, done?: string) {
  busy.value = true
  notice.value = null
  try {
    await action()
    if (done) notice.value = { ok: true, text: done }
  } catch (err) {
    notice.value = { ok: false, text: errorMessage(err, 'Zepp request failed.') }
  } finally {
    busy.value = false
  }
}

const connect = () => run(async () => window.location.assign(await startZeppConnect()))
const backfill = () => run(() => requestZeppBackfill(30), 'Zepp accepted the request. History arrives through the webhook over the next minutes or hours.')

function disconnect() {
  if (!confirmDisconnect.value) {
    confirmDisconnect.value = true
    return
  }
  confirmDisconnect.value = false
  run(async () => {
    await disconnectZepp()
    await Promise.all([load(), fitness.refreshStatus()])
  }, 'Disconnected from Zepp. Data already received is kept.')
}

onMounted(async () => {
  // Result of the OAuth round trip: /device?zepp=connected | error&reason=…
  const result = route.query.zepp
  if (result === 'connected') notice.value = { ok: true, text: 'Zepp account connected. Data appears once Zepp sends it.' }
  else if (result === 'error') notice.value = { ok: false, text: REASONS[String(route.query.reason)] ?? 'Connecting Zepp failed.' }
  if (result) router.replace({ query: {} })
  if (!mode.isDemo) {
    await load()
    if (result === 'connected') fitness.refreshStatus()
  }
})
</script>
