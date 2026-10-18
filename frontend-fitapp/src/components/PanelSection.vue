<template>
  <section class="min-w-0 rounded-xl border border-line bg-surface p-4 sm:p-5" :aria-labelledby="id">
    <div class="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 :id="id" class="text-base font-semibold tracking-tight">{{ title }}</h2>
      <slot name="aside" />
    </div>
    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
const id = `panel-${Math.random().toString(36).slice(2, 8)}`
</script>
