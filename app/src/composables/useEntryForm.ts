import { ref } from 'vue'

/** Saving/error state shared by the journal forms. */
export function useEntryForm(emitDone: () => void) {
  const saving = ref(false)
  const error = ref<string | null>(null)

  async function run(action: () => Promise<void>) {
    saving.value = true
    error.value = null
    try {
      await action()
      emitDone()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Could not save.'
    } finally {
      saving.value = false
    }
  }

  return { saving, error, run }
}
