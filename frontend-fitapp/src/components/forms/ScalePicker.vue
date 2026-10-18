<template>
  <fieldset class="min-w-0">
    <legend class="mb-1.5 text-sm font-medium text-ink-2">
      {{ label }}<span v-if="!required" class="font-normal text-muted"> (optional)</span>
    </legend>
    <div class="flex flex-wrap items-center gap-1.5">
      <label
        v-for="n in 5"
        :key="n"
        class="flex min-w-14 flex-1 cursor-pointer flex-col items-center rounded-lg border px-2 py-1.5 text-center transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--focus)]"
        :class="modelValue === n ? 'border-accent bg-accent-soft text-ink' : 'border-line bg-surface text-ink-2 hover:border-line-strong'"
      >
        <input v-model="value" type="radio" :name="name" :value="n" class="sr-only" />
        <span class="tabular text-sm font-semibold">{{ n }}</span>
        <span class="text-[11px] leading-tight">{{ labels[n - 1] }}</span>
      </label>
      <button v-if="!required && modelValue !== null" type="button" class="px-2 text-xs text-muted underline underline-offset-2 hover:text-ink" @click="value = null">
        Clear
      </button>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ modelValue: number | null; label: string; labels: string[]; required?: boolean }>(), { required: false })
const emit = defineEmits<{ 'update:modelValue': [number | null] }>()
const name = `scale-${Math.random().toString(36).slice(2, 8)}`
const value = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })
</script>
