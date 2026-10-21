<template>
  <!-- Mobile history: one tappable row per day or period instead of a wide table. -->
  <ul :id="id" class="-mx-1 divide-y divide-line">
    <li v-for="r in rows" :key="r.key">
      <button
        type="button"
        class="flex min-h-14 w-full items-center gap-3 rounded-xl px-1 py-2.5 text-left transition-colors duration-150 active:bg-page"
        :class="r.selected ? 'bg-accent-soft/60' : ''"
        :aria-current="r.selected ? 'date' : undefined"
        @click="emit('select', r.key)"
      >
        <span class="min-w-0 flex-1">
          <span class="block text-sm font-medium">{{ r.title }}</span>
          <span v-if="r.detail" class="tabular block truncate text-xs text-muted">{{ r.detail }}</span>
        </span>
        <span class="tabular shrink-0 text-right text-sm font-semibold" :class="r.value === EMPTY ? 'text-muted' : ''">{{ r.value }}</span>
      </button>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { EMPTY } from '@/lib/format'

export interface HistoryRow {
  key: string
  title: string
  value: string
  detail?: string
  selected?: boolean
}

defineProps<{ rows: HistoryRow[]; id?: string }>()
const emit = defineEmits<{ select: [key: string] }>()
</script>
