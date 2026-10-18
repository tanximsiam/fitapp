<template>
  <!-- A modal is warranted here: a short, focused entry that returns to where the user was. -->
  <dialog
    ref="dialog"
    aria-labelledby="quick-log-title"
    class="m-auto max-h-[92dvh] w-[min(36rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-line bg-surface p-0 text-ink shadow-[0_24px_64px_rgb(0_0_0/0.18)] backdrop:bg-black/40 max-sm:mb-0 max-sm:rounded-b-none"
    @close="ui.closeQuickLog()"
    @click.self="close"
  >
    <div class="sticky top-0 z-10 border-b border-line bg-surface px-5 pt-4 pb-3">
      <div class="flex items-center justify-between">
        <h2 id="quick-log-title" class="text-lg font-semibold tracking-tight">Quick log</h2>
        <button type="button" class="grid size-8 place-items-center rounded-lg text-ink-2 hover:bg-page" aria-label="Close" @click="close">
          <ion-icon :icon="closeOutline" aria-hidden="true" class="text-xl" />
        </button>
      </div>
      <p class="mt-0.5 text-xs text-muted">Saved as your own entry{{ mode.isDemo ? ' in this browser (demo)' : '' }}. Works while the watch is not syncing.</p>
      <div role="tablist" aria-label="What to log" class="mt-3 flex gap-1">
        <button
          v-for="t in tabs"
          :key="t.kind"
          role="tab"
          type="button"
          :aria-selected="ui.quickLog === t.kind"
          class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150"
          :class="ui.quickLog === t.kind ? 'bg-ink text-page' : 'text-ink-2 hover:bg-page'"
          @click="ui.quickLog = t.kind"
        >
          {{ t.label }}
        </button>
      </div>
    </div>
    <div v-if="ui.quickLog" class="px-5 py-4" role="tabpanel">
      <MoodForm v-if="ui.quickLog === 'mood'" :key="`m${openCount}`" :date="fitness.today" @done="done" />
      <MealForm v-else-if="ui.quickLog === 'meal'" :key="`f${openCount}`" :date="fitness.today" @done="done" />
      <DrinkForm v-else-if="ui.quickLog === 'drink'" :key="`d${openCount}`" :date="fitness.today" @done="done" />
      <CycleDayForm v-else :key="`c${openCount}`" :date="fitness.today" @done="done" />
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IonIcon } from '@ionic/vue'
import { closeOutline } from 'ionicons/icons'
import CycleDayForm from '@/components/forms/CycleDayForm.vue'
import DrinkForm from '@/components/forms/DrinkForm.vue'
import MealForm from '@/components/forms/MealForm.vue'
import MoodForm from '@/components/forms/MoodForm.vue'
import { useFitnessStore } from '@/stores/fitness'
import { useJournalStore } from '@/stores/journal'
import { useModeStore } from '@/stores/mode'
import { useUiStore, type LogKind } from '@/stores/ui'

const ui = useUiStore()
const journal = useJournalStore()
const fitness = useFitnessStore()
const mode = useModeStore()
const dialog = ref<HTMLDialogElement | null>(null)
const openCount = ref(0)

const tabs = computed(() =>
  (
    [
      { kind: 'mood', label: 'Mood', on: journal.prefs.mood },
      { kind: 'meal', label: 'Meal', on: journal.prefs.food },
      { kind: 'drink', label: 'Drink', on: journal.prefs.food },
      { kind: 'cycle', label: 'Cycle', on: journal.prefs.cycle },
    ] as { kind: LogKind; label: string; on: boolean }[]
  ).filter((t) => t.on),
)

watch(
  () => ui.quickLog,
  (kind) => {
    if (kind && !dialog.value?.open) {
      if (!tabs.value.some((t) => t.kind === kind)) ui.quickLog = tabs.value[0]?.kind ?? 'mood'
      openCount.value++
      journal.ensureLoaded()
      dialog.value?.showModal()
    } else if (!kind && dialog.value?.open) {
      dialog.value.close()
    }
  },
)

const close = () => dialog.value?.close()
const done = () => close()
</script>
