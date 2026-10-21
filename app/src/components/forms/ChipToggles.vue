<template>
  <fieldset class="min-w-0">
    <legend class="mb-1.5 text-sm font-medium text-ink-2">{{ label }}<span class="font-normal text-muted"> (optional)</span></legend>
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="opt in options"
        :key="opt"
        type="button"
        :aria-pressed="modelValue.includes(opt)"
        class="rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150"
        :class="modelValue.includes(opt) ? 'border-accent bg-accent-soft text-ink' : 'border-line bg-surface text-ink-2 hover:border-line-strong'"
        @click="toggle(opt)"
      >
        {{ format(opt) }}
      </button>
    </div>
  </fieldset>
</template>

<script setup lang="ts" generic="T extends string">
const props = withDefaults(defineProps<{ modelValue: T[]; options: readonly T[]; label: string; format?: (v: T) => string }>(), {
  format: (v: string) => v.replace(/_/g, ' '),
})
const emit = defineEmits<{ 'update:modelValue': [T[]] }>()

function toggle(opt: T) {
  emit('update:modelValue', props.modelValue.includes(opt) ? props.modelValue.filter((v) => v !== opt) : [...props.modelValue, opt])
}
</script>
