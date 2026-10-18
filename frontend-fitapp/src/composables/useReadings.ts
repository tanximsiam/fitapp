import { ref, watch } from 'vue'
import { errorMessage } from '@/api/client'
import { useFitnessStore } from '@/stores/fitness'
import { useModeStore } from '@/stores/mode'
import type { Reading, ReadingKind } from '@/types/fitness'

/** Loads the selected day's stress or SpO₂ readings, keeping only the latest request. */
export function useReadings(kind: ReadingKind) {
  const fitness = useFitnessStore()
  const mode = useModeStore()
  const readings = ref<Reading[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  let request = 0

  async function load() {
    const id = ++request
    loading.value = true
    error.value = null
    try {
      const result = await mode.adapter.getReadings(kind, fitness.selectedDate)
      if (id === request) readings.value = result
    } catch (err) {
      if (id === request) {
        readings.value = []
        error.value = errorMessage(err, 'Could not load readings.')
      }
    } finally {
      if (id === request) loading.value = false
    }
  }
  watch(() => [fitness.selectedDate, mode.mode, fitness.status?.lastIngestedAt], load, { immediate: true })

  return { readings, loading, error, load }
}
