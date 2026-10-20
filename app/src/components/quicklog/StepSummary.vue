<template>
  <div>
    <h3 class="mb-3 text-lg font-semibold tracking-tight">Ready to save</h3>
    <dl class="grid grid-cols-2 gap-2">
      <div v-for="[k, v] in rows" :key="k" class="min-w-0 rounded-xl bg-page px-3 py-2">
        <dt class="text-[11px] text-muted">{{ k }}</dt>
        <dd class="truncate text-sm font-medium capitalize">{{ v }}</dd>
      </div>
    </dl>
  </div>
</template>

<script setup lang="ts">
defineProps<{ rows: string[][] }>()
</script>
