<template>
  <button
    type="button"
    :aria-expanded="expanded"
    :aria-controls="controls"
    class="group mt-3 inline-flex items-center gap-1 rounded-md py-1 text-sm font-medium text-accent transition-transform duration-150 ease-out active:scale-[0.97]"
    @click="emit('update:expanded', !expanded)"
  >
    {{ expanded ? lessLabel : moreLabel }}
    <ion-icon
      :icon="chevronDownOutline"
      aria-hidden="true"
      class="transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
      :class="expanded ? 'rotate-180' : ''"
    />
  </button>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { chevronDownOutline } from 'ionicons/icons'

withDefaults(defineProps<{ expanded: boolean; moreLabel: string; lessLabel?: string; controls?: string }>(), {
  lessLabel: 'Show less',
  controls: undefined,
})
const emit = defineEmits<{ 'update:expanded': [boolean] }>()
</script>
