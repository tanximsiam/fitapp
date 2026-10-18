<template>
  <div class="w-full min-w-[200px]">
    <div class="relative">
      <input
        v-model="localValue"
        :id="inputId"
        :type="isPasswordType && showPassword ? 'text' : type"
        :required="required"
        :placeholder="isFocused ? placeholder : ''"
        :autocomplete="autocomplete"
        @focus="isFocused = true"
        @blur="isFocused = false"
        :class="[
          'peer w-full bg-transparent text-slate-800 text-sm border rounded-3xl px-5 py-3 transition duration-300 ease focus:outline-none shadow-sm',
          error
            ? 'border-red-500 focus:border-red-500'
            : 'border-slate-200 focus:border-slate-400 hover:border-slate-300',
        ]"
      />
      <!-- Password visibility toggle -->
      <button
        v-if="isPasswordType"
        type="button"
        @click="showPassword = !showPassword"
        class="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        tabindex="-1"
        >
        <span v-if="showPassword">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="w-5 h-5 fill-current">
            <path d="M320 400c-75.85 0-137.25-58.71-142.9-133.11L72.2 185.82c-13.79 17.3-26.48 35.59-36.72 55.59a32.35 32.35 0 0 0 0 29.19C89.71 376.41 197.07 448 320 448c26.91 0 52.87-4 77.89-10.46L346 397.39a144.13 144.13 0 0 1-26 2.61zm313.82 58.1l-110.55-85.44a331.25 331.25 0 0 0 81.25-102.07 32.35 32.35 0 0 0 0-29.19C550.29 135.59 442.93 64 320 64a308.15 308.15 0 0 0-147.32 37.7L45.46 3.37A16 16 0 0 0 23 6.18L3.37 31.45A16 16 0 0 0 6.18 53.9l588.36 454.73a16 16 0 0 0 22.46-2.81l19.64-25.27a16 16 0 0 0-2.82-22.45zm-183.72-142l-39.3-30.38A94.75 94.75 0 0 0 416 256a94.76 94.76 0 0 0-121.31-92.21A47.65 47.65 0 0 1 304 192a46.64 46.64 0 0 1-1.54 10l-73.61-56.89A142.31 142.31 0 0 1 320 112a143.92 143.92 0 0 1 144 144c0 21.63-5.29 41.79-13.9 60.11z"/>
          </svg>
        </span>
        <span v-else>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="w-5 h-5 fill-current">
            <path d="M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z"/>
          </svg>
        </span>
      </button>
      
      <label
        :for="inputId"
        :class="[
          'absolute cursor-text bg-slate-50 px-1 left-4.5 transition-all transform origin-left',
          {
            'text-xs scale-90 -top-2 text-slate-400': localValue || isFocused,
            'top-3.5 text-sm text-gray-400': !localValue && !isFocused
          }
        ]"
      >
        {{ label }}
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
const isFocused = ref(false)
const showPassword = ref(false)
const inputId = `input-${Math.random().toString(36).slice(2)}`

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

const isPasswordType = computed(() => props.type === 'password')
</script>
