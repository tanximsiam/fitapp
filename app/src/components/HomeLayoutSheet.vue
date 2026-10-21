<template>
  <!-- Reorder with the handles, hide with the switches. Saved on this device. -->
  <ion-modal :is-open="open" :initial-breakpoint="1" :breakpoints="[0, 1]" class="sheet" aria-labelledby="layout-title" @did-dismiss="emit('update:open', false)">
    <div class="px-5 pt-4 pb-[max(env(safe-area-inset-bottom),20px)]">
      <div class="mb-1 flex items-center justify-between">
        <h2 id="layout-title" class="text-lg font-semibold tracking-tight">Customise Home</h2>
        <button type="button" class="min-h-9 rounded-full px-3 text-sm font-medium text-accent" @click="emit('update:open', false)">Done</button>
      </div>
      <p class="mb-4 text-sm text-ink-2">Drag to reorder. Your watch measurements always stay on Home.</p>

      <ion-list class="layout-list" lines="full">
        <ion-reorder-group :disabled="false" @ion-item-reorder="onReorder">
          <ion-item v-for="c in rows" :key="c.id">
            <ion-toggle v-if="!c.locked" v-model="c.card.visible" justify="space-between" :aria-label="`Show ${c.label}`" class="toggle">
              <span class="block text-[15px] font-medium text-ink">{{ c.label }}</span>
              <span class="block text-xs whitespace-normal text-ink-2">{{ c.hint }}</span>
            </ion-toggle>
            <ion-label v-else>
              <span class="block text-[15px] font-medium text-ink">{{ c.label }}</span>
              <span class="block text-xs whitespace-normal text-ink-2">{{ c.hint }}</span>
            </ion-label>
            <ion-reorder slot="end" />
          </ion-item>
        </ion-reorder-group>
      </ion-list>

      <button type="button" class="mt-3 min-h-11 text-sm font-medium text-ink-2" @click="reset">Restore default</button>
    </div>
  </ion-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonItem, IonLabel, IonList, IonModal, IonReorder, IonReorderGroup, IonToggle } from '@ionic/vue'
import type { ItemReorderEventDetail } from '@ionic/vue'
import { HOME_CARDS, useHomeLayout } from '@/composables/useHomeLayout'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()
const { layout, reset } = useHomeLayout()

const rows = computed(() => layout.value.map((card) => ({ card, ...HOME_CARDS.find((c) => c.id === card.id)! })))

function onReorder(e: CustomEvent<ItemReorderEventDetail>) {
  // complete(array) returns the reordered copy and settles the DOM.
  layout.value = e.detail.complete(layout.value)
}
</script>

<style scoped>
.layout-list {
  --ion-item-background: var(--surface);
  background: var(--surface);
  border-radius: 16px;
  padding: 0;
}
ion-item {
  --background: var(--surface);
  --border-color: var(--line);
  --padding-start: 0;
  --inner-padding-end: 0;
  --min-height: 60px;
  color: var(--ink);
}
.toggle {
  --track-background-checked: var(--accent);
  padding: 8px 0;
}
ion-reorder {
  color: var(--muted);
  margin-left: 12px;
}
</style>
