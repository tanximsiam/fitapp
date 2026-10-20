<template>
  <div role="radiogroup" aria-label="Range" class="inline-flex rounded-lg border border-line bg-surface p-0.5" @keydown="onKeydown">
    <button
      v-for="opt in options"
      :key="opt"
      ref="buttons"
      type="button"
      role="radio"
      :aria-checked="opt === modelValue"
      :tabindex="opt === modelValue ? 0 : -1"
      class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150"
      :class="opt === modelValue ? 'bg-accent text-accent-ink' : 'text-ink-2 hover:text-ink'"
      :aria-label="`${opt} days`"
      @click="emit('update:modelValue', opt)"
    >
      {{ opt }}d
    </button>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import type { RangeDays } from '@/stores/fitness'

const props = defineProps<{ modelValue: RangeDays }>()
const emit = defineEmits<{ 'update:modelValue': [RangeDays] }>()
const options: RangeDays[] = [7, 14, 30]
const buttons = ref<HTMLButtonElement[]>([])

function onKeydown(e: KeyboardEvent) {
  const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key]
  if (!step) return
  e.preventDefault()
  const i = (options.indexOf(props.modelValue) + step + options.length) % options.length
  emit('update:modelValue', options[i])
  nextTick(() => buttons.value[i]?.focus())
}
</script>
