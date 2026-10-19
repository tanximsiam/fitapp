<template>
  <RouterLink
    :to="to"
    :aria-current="active ? 'page' : undefined"
    :class="variant === 'rail' ? railClass : barClass"
  >
    <ion-icon :icon="icon" aria-hidden="true" class="shrink-0" :class="variant === 'rail' ? 'text-[18px]' : 'text-[22px]'" />
    <span :class="variant === 'bar' ? 'text-[11px] leading-none' : ''">{{ label }}</span>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { IonIcon } from '@ionic/vue'

const props = defineProps<{ to: string; label: string; icon: string; variant: 'rail' | 'bar' }>()
const route = useRoute()
const active = computed(() => route.path === props.to)

const railClass = computed(() => [
  'flex items-center gap-3 rounded-full px-3 py-2 text-sm transition-colors duration-150',
  active.value ? 'bg-ink text-page font-medium' : 'text-ink-2 hover:bg-surface hover:text-ink',
])
const barClass = computed(() => [
  'relative flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors duration-150',
  active.value ? 'text-accent font-medium' : 'text-muted hover:text-ink',
])
</script>
