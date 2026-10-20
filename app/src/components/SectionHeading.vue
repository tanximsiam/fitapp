<template>
  <div class="mb-3 flex items-baseline justify-between gap-3">
    <h2 :id="id" class="text-[17px] font-semibold tracking-tight">{{ title }}</h2>
    <RouterLink v-if="to" :to="to" class="-my-2 py-2 text-[13px] font-medium text-accent">{{ link }}</RouterLink>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ title: string; id?: string; to?: string; link?: string }>(), { id: undefined, to: undefined, link: 'See all' })
</script>
