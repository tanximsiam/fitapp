<template>
  <fieldset class="min-w-0">
    <legend :class="large ? 'mb-4 text-lg font-semibold tracking-tight text-ink' : 'mb-1.5 text-sm font-medium text-ink-2'">
      {{ label }}<span v-if="!required" class="text-sm font-normal text-muted"> (optional)</span>
    </legend>
    <div class="grid gap-2" :style="{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }">
      <label
        v-for="opt in options"
        :key="String(opt.value)"
        class="choice-card group relative flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl px-1.5 text-center transition-[background-color,box-shadow,scale] duration-200 ease-out active:scale-[0.96] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]"
        :class="[large ? 'py-4' : 'py-2.5', selected(opt) ? 'is-selected' : 'bg-page hover:bg-[color-mix(in_srgb,var(--c)_8%,var(--page))]']"
        :style="{ '--c': opt.color }"
      >
        <input v-model="value" type="radio" :name="name" :value="opt.value" class="sr-only" @click="emit('pick', opt.value)" />
        <ChoiceGlyph v-if="opt.glyph" :kind="opt.glyph.kind" :level="opt.glyph.level" :color="opt.color" class="glyph" :class="large ? 'size-12 sm:size-14' : 'size-9'" />
        <ion-icon v-else-if="opt.icon" :icon="opt.icon" aria-hidden="true" class="glyph" :class="large ? 'text-4xl' : 'text-2xl'" :style="{ color: opt.color }" />
        <span class="text-[12px] leading-tight font-medium sm:text-[13px]" :class="selected(opt) ? 'text-ink' : 'text-ink-2'">{{ opt.label }}</span>
        <span v-if="opt.hint" class="text-[11px] leading-tight text-muted">{{ opt.hint }}</span>
      </label>
    </div>
    <button v-if="!required && modelValue !== null" type="button" class="mt-2 text-xs text-muted underline underline-offset-2 hover:text-ink" @click="value = null">
      Clear
    </button>
  </fieldset>
</template>

<script setup lang="ts" generic="T extends string | number | null">
import { computed, useId } from 'vue'
import { IonIcon } from '@ionic/vue'
import ChoiceGlyph from './ChoiceGlyph.vue'
import type { Choice } from './choices'

const props = withDefaults(defineProps<{ modelValue: T | null; label: string; options: Choice<T>[]; required?: boolean; large?: boolean; columns?: number }>(), {
  required: false,
  large: false,
  columns: undefined,
})
const emit = defineEmits<{ 'update:modelValue': [T | null]; pick: [T] }>()
const name = useId()
const value = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })
const selected = (o: Choice<T>) => o.value === props.modelValue
</script>

<style scoped>
.is-selected {
  background: color-mix(in srgb, var(--c) 16%, var(--surface));
  box-shadow: inset 0 0 0 2px var(--c);
}
.is-selected .glyph {
  animation: pop 260ms cubic-bezier(0.23, 1, 0.32, 1);
}
@keyframes pop {
  0% { scale: 0.85; }
  60% { scale: 1.08; }
  100% { scale: 1; }
}
@media (hover: hover) {
  .choice-card:hover .glyph {
    translate: 0 -2px;
  }
}
.glyph {
  transition: translate 200ms ease-out;
}
</style>
