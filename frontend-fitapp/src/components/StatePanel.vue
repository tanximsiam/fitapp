<template>
  <div
    class="rounded-xl border px-5 py-6 text-sm"
    :class="kind === 'error' ? 'border-danger/30 bg-danger-soft' : 'border-dashed border-line-strong bg-surface'"
    :role="kind === 'error' ? 'alert' : undefined"
  >
    <p class="font-medium" :class="kind === 'error' ? 'text-danger' : 'text-ink'">{{ title }}</p>
    <p v-if="$slots.default" class="mt-1 max-w-prose text-ink-2"><slot /></p>
    <div v-if="$slots.actions" class="mt-4 flex flex-wrap gap-2"><slot name="actions" /></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ kind: 'error' | 'empty'; title: string }>()
</script>
