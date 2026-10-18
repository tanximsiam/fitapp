<template>
  <div>
    <form class="flex flex-col gap-3 sm:flex-row sm:items-end" novalidate @submit.prevent="create">
      <FormInput v-model="name" class="sm:max-w-xs" label="Token name" placeholder="e.g. home-bridge" :error="!!nameError" :hint="nameError" />
      <PrimaryButton type="submit" :label="creating ? 'Creating…' : 'Create ingest token'" :disabled="creating" />
    </form>

    <div v-if="created" class="mt-4 rounded-lg border border-line-strong bg-page p-3" role="status">
      <p class="text-sm font-medium">Copy this token now. It will not be shown again.</p>
      <div class="mt-2 flex items-center gap-2">
        <code class="min-w-0 flex-1 truncate rounded-md bg-surface px-2 py-1.5 font-mono text-xs">{{ created }}</code>
        <PrimaryButton variant="secondary" :label="copied ? 'Copied' : 'Copy'" @click="copy" />
      </div>
      <p class="mt-2 text-xs text-muted">It can only upload data to <code>POST /api/ingest</code>; it cannot read your data.</p>
    </div>

    <p v-if="error" role="alert" class="mt-4 text-sm text-danger">{{ error }}</p>

    <ul v-if="tokens.length" class="mt-5 divide-y divide-line border-y border-line">
      <li v-for="t in tokens" :key="t.id" class="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
        <div>
          <p class="font-medium">{{ t.name }}</p>
          <p class="text-xs text-muted">Created {{ formatRelative(t.createdAt) }} · last used {{ formatRelative(t.lastUsedAt) }}</p>
        </div>
        <button
          type="button"
          class="rounded-lg px-2.5 py-1.5 text-xs font-medium text-danger transition-colors duration-150 hover:bg-danger-soft"
          :aria-label="`Revoke token ${t.name}`"
          @click="revoke(t.id)"
        >
          {{ confirming === t.id ? 'Click again to revoke' : 'Revoke' }}
        </button>
      </li>
    </ul>
    <p v-else-if="loaded" class="mt-5 text-sm text-muted">No ingest tokens yet.</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import FormInput from '@/components/FormInput.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import * as fitnessApi from '@/api/fitness'
import { errorMessage } from '@/api/client'
import { formatRelative } from '@/lib/format'
import type { IngestToken } from '@/types/fitness'

const tokens = ref<IngestToken[]>([])
const loaded = ref(false)
const name = ref('')
const nameError = ref<string>()
const creating = ref(false)
const created = ref<string | null>(null)
const copied = ref(false)
const error = ref<string | null>(null)
const confirming = ref<number | null>(null)

async function refresh() {
  try {
    tokens.value = await fitnessApi.listIngestTokens()
    loaded.value = true
  } catch (err) {
    error.value = errorMessage(err, 'Could not load tokens.')
  }
}
onMounted(refresh)

async function create() {
  nameError.value = name.value.trim() ? undefined : 'Give the token a name you will recognise.'
  if (nameError.value) return
  creating.value = true
  error.value = null
  try {
    created.value = await fitnessApi.createIngestToken(name.value.trim())
    copied.value = false
    name.value = ''
    await refresh()
  } catch (err) {
    error.value = errorMessage(err, 'Could not create the token.')
  } finally {
    creating.value = false
  }
}

async function copy() {
  if (!created.value) return
  try {
    await navigator.clipboard.writeText(created.value)
    copied.value = true
  } catch {
    error.value = 'Copy failed. Select the token and copy it manually.'
  }
}

async function revoke(id: number) {
  // Two-step confirm inline instead of a modal.
  if (confirming.value !== id) {
    confirming.value = id
    return
  }
  confirming.value = null
  try {
    await fitnessApi.revokeIngestToken(id)
    await refresh()
  } catch (err) {
    error.value = errorMessage(err, 'Could not revoke the token.')
  }
}
</script>
