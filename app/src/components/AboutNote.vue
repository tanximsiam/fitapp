<template>
  <details class="group card px-4 py-3 sm:px-5">
    <summary class="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-ink-2 select-none hover:text-ink [&::-webkit-details-marker]:hidden">
      <span class="flex items-center gap-2">
        <ion-icon :icon="informationCircleOutline" aria-hidden="true" class="text-base" />{{ title }}
      </span>
      <ion-icon :icon="chevronDownOutline" aria-hidden="true" class="transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-open:rotate-180" />
    </summary>
    <div class="mt-3 text-sm text-ink-2"><slot /></div>
  </details>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { chevronDownOutline, informationCircleOutline } from 'ionicons/icons'

withDefaults(defineProps<{ title?: string }>(), { title: 'About these readings' })
</script>
