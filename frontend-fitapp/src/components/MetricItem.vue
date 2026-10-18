<template>
  <div class="min-w-0">
    <dt class="text-xs text-muted">{{ label }}</dt>
    <dd class="tabular mt-1 text-lg font-semibold tracking-tight" :class="value === EMPTY ? 'text-muted' : 'text-ink'">
      {{ value }}
      <span v-if="note" class="ml-1 text-xs font-normal text-muted">{{ note }}</span>
    </dd>
  </div>
</template>

<script setup lang="ts">
import { EMPTY } from '@/lib/format'

defineProps<{ label: string; value: string; note?: string }>()
</script>
