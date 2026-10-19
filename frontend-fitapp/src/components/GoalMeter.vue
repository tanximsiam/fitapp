<template>
  <div class="min-w-0">
    <div class="flex items-baseline justify-between gap-3">
      <span class="flex items-center gap-1.5 text-sm text-ink-2">
        <ion-icon v-if="icon" :icon="icon" aria-hidden="true" class="shrink-0 self-center" :style="{ color }" />{{ label }}
      </span>
      <span v-if="reached" class="reached inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" :style="{ background: 'var(--ink-2)', color: 'var(--surface)' }">
        <ion-icon :icon="checkmark" aria-hidden="true" />Goal reached
      </span>
      <span v-else class="text-xs text-muted">{{ ratio === null ? 'Not measured' : `${Math.round(ratio * 100)}% of ${goalText}` }}</span>
    </div>
    <p class="tabular mt-1 text-2xl font-semibold tracking-tight" :class="ratio === null ? 'text-muted' : ''">
      <span aria-hidden="true">{{ value != null && format ? format(shown) : valueText }}</span><span class="sr-only">{{ valueText }}</span>
    </p>
    <div
      class="mt-2 h-1.5 overflow-hidden rounded-full bg-line"
      role="meter"
      :aria-label="`${label} goal progress`"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="ratio === null ? undefined : Math.min(100, Math.round(ratio * 100))"
      :aria-valuetext="ratio === null ? 'Not measured' : `${Math.round(ratio * 100)}% of ${goalText}`"
    >
      <div
        v-if="ratio !== null"
        class="h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
        :style="{ width: `${empty ? 0 : Math.min(100, ratio * 100)}%`, background: color }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, toRef } from 'vue'
import { IonIcon } from '@ionic/vue'
import { checkmark } from 'ionicons/icons'
import { useCountUp } from '@/composables/useCountUp'

const props = withDefaults(
  defineProps<{ label: string; valueText: string; goalText: string; ratio: number | null; color: string; icon?: string; value?: number | null; format?: (n: number) => string }>(),
  { icon: undefined, value: undefined, format: undefined },
)
const shown = useCountUp(toRef(props, 'value'))
const reached = computed(() => props.ratio !== null && props.ratio >= 1)
// The bar starts empty and fills after the first paint, so the CSS transition plays on arrival.
const empty = ref(true)
onMounted(() => requestAnimationFrame(() => requestAnimationFrame(() => (empty.value = false))))
</script>

<style scoped>
.reached {
  animation: badge 360ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes badge {
  from {
    opacity: 0;
    scale: 0.6;
  }
}
</style>
