<template>
  <!-- One measurement on Home: tinted badge, value, and when or how it was measured. Opens the module. -->
  <RouterLink :to="to" class="card flex min-w-0 flex-col p-3.5 transition-[scale] duration-150 ease-out active:scale-[0.98]" :class="`tone-${tone}`">
    <span class="flex items-center gap-2">
      <span class="badge grid size-7 shrink-0 place-items-center rounded-lg" aria-hidden="true"><ion-icon :icon="icon" class="text-[15px]" /></span>
      <span class="min-w-0 flex-1 truncate text-[13px] font-medium text-ink-2">{{ title }}</span>
      <ion-icon :icon="chevronForward" aria-hidden="true" class="shrink-0 text-sm text-muted" />
    </span>
    <span class="tabular mt-3 text-[22px] leading-none font-semibold tracking-tight" :class="value == null ? 'text-muted' : ''">
      {{ value ?? 'Not measured' }}<span v-if="value != null && unit" class="ml-1 text-sm font-medium text-ink-2">{{ unit }}</span>
    </span>
    <slot />
    <span v-if="sub" class="mt-1.5 truncate text-xs text-muted">{{ sub }}</span>
  </RouterLink>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { chevronForward } from 'ionicons/icons'
import type { Tone } from '@/components/PanelSection.vue'

withDefaults(defineProps<{ to: string; title: string; icon: string; tone: Tone; value: string | null; unit?: string; sub?: string }>(), {
  unit: undefined,
  sub: undefined,
})
</script>

<style scoped>
.badge {
  background: var(--tone-soft);
  color: var(--tone);
}
.tone-skin .badge {
  color: var(--tone-ink);
}
</style>
