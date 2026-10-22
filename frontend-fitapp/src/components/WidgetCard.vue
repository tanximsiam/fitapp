<template>
  <section class="card flex min-w-0 flex-col p-4 sm:p-5" :class="`tone-${tone}`" :aria-labelledby="id">
    <div class="flex items-center gap-2.5">
      <span class="badge grid size-8 shrink-0 place-items-center rounded-lg" aria-hidden="true">
        <ion-icon :icon="icon" class="text-[17px]" />
      </span>
      <h2 :id="id" class="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight">{{ title }}</h2>
      <slot name="aside" />
      <RouterLink
        v-if="to"
        :to="to"
        class="grid size-8 shrink-0 place-items-center rounded-full text-ink-2 ring-1 ring-line transition-colors duration-150 hover:bg-page hover:text-ink"
        :aria-label="`${title} details`"
      >
        <ion-icon :icon="chevronForward" aria-hidden="true" />
      </RouterLink>
    </div>
    <p v-if="label" class="mt-3 text-xs text-muted">
      {{ label }} <span class="tabular ml-1 text-lg font-semibold tracking-tight text-ink">{{ value }}</span>
      <span v-if="note" class="ml-1">{{ note }}</span>
    </p>
    <div class="mt-3 min-w-0 flex-1"><slot /></div>
  </section>
</template>

<script setup lang="ts">
import { useId } from 'vue'
import { IonIcon } from '@ionic/vue'
import { chevronForward } from 'ionicons/icons'
import type { Tone } from '@/components/PanelSection.vue'

withDefaults(defineProps<{ title: string; icon: string; tone: Tone; to?: string; label?: string; value?: string; note?: string }>(), {
  to: undefined,
  label: undefined,
  value: undefined,
  note: undefined,
})
const id = useId()
</script>

<style scoped>
/* The card stays white; only the icon badge takes the metric's tint (tone-* sets the variables). */
section {
  background: var(--surface);
}
.badge {
  background: var(--tone-soft);
  color: var(--tone-icon);
}
</style>
