<template>
  <!-- Changes made on this phone that the server refused. Nothing is overwritten until the person decides. -->
  <section v-if="issues.length" class="card p-4" aria-labelledby="sync-issues-title">
    <h2 id="sync-issues-title" class="text-[15px] font-semibold text-danger">{{ issues.length === 1 ? 'A change needs your decision' : `${issues.length} changes need your decision` }}</h2>
    <ul class="mt-3 divide-y divide-line">
      <li v-for="op in issues" :key="op.id" class="py-3 first:pt-0 last:pb-0">
        <p class="text-sm font-medium">{{ describeOp(op) }}</p>
        <p class="mt-0.5 text-[13px] text-ink-2">
          {{ op.state === 'conflict' ? 'This entry was changed on another device after you edited it here.' : op.error }}
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <PrimaryButton
            v-if="op.state === 'conflict'"
            :label="busy === op.id ? 'Saving…' : 'Keep mine'"
            :disabled="!!busy"
            @click="resolve(op.id, 'mine')"
          />
          <PrimaryButton
            variant="secondary"
            :label="op.state === 'conflict' ? 'Keep the other version' : 'Discard my change'"
            :disabled="!!busy"
            @click="resolve(op.id, 'theirs')"
          />
        </div>
      </li>
    </ul>
    <p v-if="error" role="alert" class="mt-3 text-sm text-danger">{{ error }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import { connection } from '@/data/offline'
import { describeOp } from '@/data/outbox'
import { useJournalStore } from '@/stores/journal'
import { useModeStore } from '@/stores/mode'

const mode = useModeStore()
const journal = useJournalStore()
const issues = computed(() => (mode.isDemo ? [] : connection.queue.filter((q) => q.state !== 'pending')))
const busy = ref<string | null>(null)
const error = ref<string | null>(null)

async function resolve(id: string, choice: 'mine' | 'theirs') {
  busy.value = id
  error.value = null
  try {
    await mode.offlineJournal?.resolve(id, choice)
    await journal.load()
  } catch {
    error.value = "Can't connect right now. Try again when you're online."
  } finally {
    busy.value = null
  }
}
</script>
