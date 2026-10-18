<template>
  <button
    :type="type"
    :disabled="disabled"
    v-ripple
    class="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-[color,background-color,border-color,transform,filter] duration-150 ease-out active:enabled:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
    :class="
      variant === 'primary'
        ? 'bg-accent text-accent-ink hover:enabled:brightness-110'
        : 'border border-line-strong bg-surface text-ink hover:enabled:border-ink-2'
    "
  >
    {{ label }}
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
    variant?: 'primary' | 'secondary'
  }>(),
  { disabled: false, type: 'button', variant: 'primary' },
)
</script>
