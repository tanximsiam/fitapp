<template>
  <!-- A day's records as a vertical timeline: time, what happened, and where it came from. -->
  <ol v-if="rows.length" class="relative">
    <li v-for="(r, i) in rows" :key="i" class="relative flex gap-3 pb-4 last:pb-0">
      <span v-if="i < rows.length - 1" class="absolute top-9 bottom-0 left-[17px] w-px bg-line" aria-hidden="true" />
      <span class="relative grid size-9 shrink-0 place-items-center rounded-full bg-page text-ink-2" aria-hidden="true">
        <ion-icon :icon="r.icon" class="text-base" />
      </span>
      <RouterLink :to="r.to" class="min-w-0 flex-1 pt-0.5">
        <span class="flex items-baseline gap-2">
          <span class="text-sm font-semibold">{{ r.area }}</span>
          <span class="tabular text-xs text-muted">{{ r.time ?? 'Day total' }}</span>
          <EntryBadge class="ml-auto" :kind="r.source" />
        </span>
        <span class="mt-0.5 block text-[13px] leading-snug text-ink-2">{{ r.text }}</span>
      </RouterLink>
    </li>
  </ol>
  <p v-else class="text-sm text-muted">{{ emptyText }}</p>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import EntryBadge from '@/components/EntryBadge.vue'
import type { TimelineRow } from '@/data/timeline'

withDefaults(defineProps<{ rows: TimelineRow[]; emptyText?: string }>(), { emptyText: 'Nothing recorded yet.' })
</script>
