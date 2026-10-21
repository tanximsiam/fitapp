<template>
  <div class="mt-5 flex flex-wrap items-center gap-2">
    <PrimaryButton type="submit" :label="saving ? 'Saving…' : saveLabel" :disabled="saving" />
    <PrimaryButton v-if="cancellable" variant="secondary" label="Cancel" @click="emit('cancel')" />
    <button
      v-if="deletable"
      type="button"
      class="ml-auto rounded-lg px-3 py-2 text-sm font-medium text-danger transition-colors duration-150 hover:bg-danger-soft"
      @click="onDelete"
    >
      {{ confirming ? 'Click again to delete' : 'Delete' }}
    </button>
    <p v-if="error" role="alert" class="basis-full text-sm text-danger">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PrimaryButton from '@/components/PrimaryButton.vue'

withDefaults(defineProps<{ saving: boolean; error: string | null; saveLabel?: string; cancellable?: boolean; deletable?: boolean }>(), {
  saveLabel: 'Save',
  cancellable: true,
  deletable: false,
})
const emit = defineEmits<{ cancel: []; delete: [] }>()
const confirming = ref(false)

function onDelete() {
  if (!confirming.value) {
    confirming.value = true
    return
  }
  confirming.value = false
  emit('delete')
}
</script>
