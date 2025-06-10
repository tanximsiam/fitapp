<template>
  <button
    :type="type"
    :disabled="disabled"
    class="bg-rose-700 text-white rounded-3xl px-6 py-3 text-sm transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed hover:enabled:bg-blue-700"
    @click="emitClick"
    v-bind="$attrs"
    v-ripple
  >
    {{ label }}
  </button>
</template>

<script setup lang="ts">
const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  onClick: {
    type: Function,
    required: false, // optional
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String as () => 'button' | 'submit' | 'reset',
    default: 'button', // allows "submit", "reset", etc.
  },
})

function emitClick(event: MouseEvent) {
  if (props.onClick) {
    props.onClick(event)
  }
}
</script>
