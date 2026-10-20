<template>
  <AppShell title="Insights">
    <template #subtitle>Patterns across your records, with how each one is worked out</template>
    <template #actions><RangeTabs :model-value="fitness.rangeDays" @update:model-value="fitness.setRange" /></template>

    <DataState>
      <JournalState>
        <WellbeingOverview />
        <p class="mt-4 px-1 text-xs leading-relaxed text-muted">
          These are associations in your own records, never causes, diagnoses or advice. FitApp makes a statement only when there is enough data for it.
        </p>
      </JournalState>
    </DataState>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import DataState from '@/components/DataState.vue'
import JournalState from '@/components/JournalState.vue'
import RangeTabs from '@/components/RangeTabs.vue'
import WellbeingOverview from '@/components/WellbeingOverview.vue'
import { useJournalData } from '@/composables/useJournalData'

const { fitness } = useJournalData()
</script>
