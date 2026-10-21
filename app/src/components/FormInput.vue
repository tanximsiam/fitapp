<template>
  <div class="w-full min-w-0">
    <label :for="inputId" class="mb-1.5 block text-sm font-medium text-ink-2">{{ label }}</label>
    <div class="relative">
      <input
        :id="inputId"
        :value="modelValue"
        :type="isPassword && showPassword ? 'text' : type"
        :required="required"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :min="min"
        :max="max"
        :step="step"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="hint ? `${inputId}-hint` : undefined"
        class="min-h-12 w-full rounded-xl border bg-surface px-3.5 text-base text-ink transition-colors duration-150 placeholder:text-muted focus:outline-none focus-visible:border-ink-2 focus-visible:ring-2 focus-visible:ring-accent/30"
        :class="[error ? 'border-danger' : 'border-line-strong hover:border-ink-2', isPassword ? 'pr-12' : '']"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <button
        v-if="isPassword"
        type="button"
        class="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted hover:text-ink"
        :aria-label="showPassword ? 'Hide password' : 'Show password'"
        :aria-pressed="showPassword"
        @click="showPassword = !showPassword"
      >
        <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline" aria-hidden="true" class="text-lg" />
      </button>
    </div>
    <p v-if="hint" :id="`${inputId}-hint`" class="mt-1 text-xs text-muted">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { IonIcon } from '@ionic/vue'
import { eyeOffOutline, eyeOutline } from 'ionicons/icons'

const props = withDefaults(
  defineProps<{
    modelValue: string | number
    label: string
    type?: string
    placeholder?: string
    required?: boolean
    error?: boolean
    autocomplete?: string
    inputmode?: 'text' | 'numeric' | 'decimal' | 'email'
    min?: number
    max?: number
    step?: number | string
    hint?: string
  }>(),
  { type: 'text', placeholder: '', required: false, error: false, autocomplete: 'off', inputmode: undefined, min: undefined, max: undefined, step: undefined, hint: undefined },
)
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const showPassword = ref(false)
const inputId = `input-${Math.random().toString(36).slice(2)}`
const isPassword = computed(() => props.type === 'password')
</script>
