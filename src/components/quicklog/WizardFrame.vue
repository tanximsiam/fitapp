<template>
  <form class="flex min-h-[26rem] flex-col" novalidate @submit.prevent="onNext">
    <div class="mb-5">
      <div class="mb-2 flex items-baseline justify-between text-xs text-muted">
        <span class="font-medium" :style="{ color }">{{ title }}</span>
        <span class="tabular">Step {{ step + 1 }} of {{ total }}</span>
      </div>
      <div class="flex gap-1" aria-hidden="true">
        <span v-for="i in total" :key="i" class="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
          <span class="block h-full rounded-full transition-[width] duration-300 ease-out" :style="{ width: i <= step + 1 ? '100%' : '0%', background: color }" />
        </span>
      </div>
    </div>

    <div class="relative flex-1">
      <Transition :name="direction > 0 ? 'step-next' : 'step-back'" mode="out-in">
        <div :key="step" ref="page" class="grid gap-5" tabindex="-1">
          <slot />
        </div>
      </Transition>
    </div>

    <p v-if="error" role="alert" class="mt-4 text-sm text-danger">{{ error }}</p>
    <div class="mt-6 flex items-center gap-2">
      <button type="button" class="rounded-full px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors duration-150 hover:bg-page hover:text-ink" @click="onBack">
        {{ step === 0 ? 'All log types' : 'Back' }}
      </button>
      <PrimaryButton class="ml-auto min-w-28" type="submit" :disabled="saving || blocked" :label="nextLabel" />
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import PrimaryButton from '@/components/PrimaryButton.vue'

const props = defineProps<{ title: string; color: string; total: number; saving: boolean; error: string | null; blocked?: boolean; skippable?: boolean; check?: () => boolean }>()
const emit = defineEmits<{ exit: []; save: [] }>()
const step = defineModel<number>('step', { required: true })
const direction = ref(1)
const page = ref<HTMLElement | null>(null)

const last = computed(() => step.value === props.total - 1)
const nextLabel = computed(() => (props.saving ? 'Saving…' : last.value ? 'Save' : props.skippable ? 'Skip' : 'Continue'))

function onNext() {
  if (props.blocked || (props.check && !props.check())) return
  if (last.value) return emit('save')
  direction.value = 1
  step.value++
}
function onBack() {
  if (step.value === 0) return emit('exit')
  direction.value = -1
  step.value--
}

// Move focus to the new page so screen readers announce it and keyboard users continue from the top.
watch(step, () => nextTick(() => setTimeout(() => page.value?.focus({ preventScroll: true }), 200)))
</script>

<style scoped>
.step-next-enter-active,
.step-next-leave-active,
.step-back-enter-active,
.step-back-leave-active {
  transition: opacity 160ms ease-out, translate 200ms cubic-bezier(0.23, 1, 0.32, 1);
}
.step-next-enter-from,
.step-back-leave-to {
  opacity: 0;
  translate: 24px 0;
}
.step-next-leave-to,
.step-back-enter-from {
  opacity: 0;
  translate: -24px 0;
}
[tabindex='-1']:focus {
  outline: none;
}
</style>
