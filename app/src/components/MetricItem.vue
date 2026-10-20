<template>
  <div class="min-w-0">
    <dt class="flex items-center gap-1.5 text-xs text-muted">
      <ion-icon v-if="icon" :icon="icon" aria-hidden="true" class="shrink-0 text-sm text-ink-2" />{{ label }}
    </dt>
    <dd class="tabular mt-1 text-lg font-semibold tracking-tight" :class="value === EMPTY ? 'text-muted' : 'text-ink'">
      {{ value }}
      <span v-if="note" class="ml-1 text-xs font-normal text-muted">{{ note }}</span>
    </dd>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { EMPTY } from '@/lib/format'

withDefaults(defineProps<{ label: string; value: string; note?: string; icon?: string }>(), { note: undefined, icon: undefined })
</script>
