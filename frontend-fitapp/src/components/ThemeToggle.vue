<template>
  <div role="radiogroup" aria-label="Theme" class="inline-flex rounded-lg border border-line bg-surface p-0.5" @keydown="onKeydown">
    <button
      v-for="opt in OPTIONS"
      :key="opt.value"
      ref="buttons"
      type="button"
      role="radio"
      :aria-checked="choice === opt.value"
      :aria-label="opt.label"
      :title="opt.label"
      :tabindex="choice === opt.value ? 0 : -1"
      class="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors duration-150"
      :class="choice === opt.value ? 'bg-accent text-accent-ink' : 'text-ink-2 hover:text-ink'"
      @click="choice = opt.value"
    >
      <ion-icon :icon="opt.icon" aria-hidden="true" class="text-sm" />
      <span v-if="labels">{{ opt.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { IonIcon } from '@ionic/vue'
import { contrastOutline, moonOutline, sunnyOutline } from 'ionicons/icons'
import { useTheme, type ThemeChoice } from '@/composables/useTheme'

withDefaults(defineProps<{ labels?: boolean }>(), { labels: false })
const { choice } = useTheme()
const buttons = ref<HTMLButtonElement[]>([])
const OPTIONS: { value: ThemeChoice; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: sunnyOutline },
  { value: 'dark', label: 'Dark', icon: moonOutline },
  { value: 'system', label: 'System', icon: contrastOutline },
]

function onKeydown(e: KeyboardEvent) {
  const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key]
  if (!step) return
  e.preventDefault()
  const i = (OPTIONS.findIndex((o) => o.value === choice.value) + step + OPTIONS.length) % OPTIONS.length
  choice.value = OPTIONS[i].value
  nextTick(() => buttons.value[i]?.focus())
}
</script>
