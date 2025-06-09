<template>
  <div class="w-full max-w-sm min-w-[200px] mb-4">
    <div class="relative">
      <input
        v-model="localValue"
        :type="type"
        :required="required"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :class="[
          'peer w-full bg-transparent text-gray-900 text-sm border rounded-md px-3 py-4 transition duration-300 ease focus:outline-none shadow-sm',
          error
            ? 'border-red-500 focus:border-red-500'
            : 'border-slate-200 focus:border-slate-400 hover:border-slate-300',
        ]"
      />

      <label
        :class="[
          'absolute cursor-text bg-slate-50 px-1 left-2.5 text-slate-200 text-sm transition-all transform origin-left',
          'peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:-top-2 peer-focus:left-2.5 peer-focus:text-xs peer-focus:text-slate-400 peer-focus:scale-90',
          localValue
            ? '-top-2 left-2.5 text-xs scale-90 text-slate-400'
            : 'top-2.5',
        ]"
      >
        {{ label }}
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: 'Type Here...',
  },
  placeholder: {
    type: String,
    default: '',
    },
  type: {
    type: String,
    default: 'text',
  },
  required: {
    type: Boolean,
    default: false,
  },
  error: {
    type: Boolean,
    default: false,
  },
  autocomplete: {
    type: String,
    default: 'off',
    }
})

const emit = defineEmits(['update:modelValue'])

const localValue = ref(props.modelValue)

// Sync external changes into local
watch(() => props.modelValue, (val) => {
  if (val !== localValue.value) localValue.value = val
})

// Emit updates outward
watch(localValue, (val) => {
  emit('update:modelValue', val)
})
</script>
