import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useJournalStore } from '@/stores/journal'
import { useFitnessData } from './useFitnessData'

/** Journal pages also need watch data (shared date, cross-references), so both are loaded. */
export function useJournalData() {
  const fitnessData = useFitnessData()
  const journal = useJournalStore()
  onMounted(() => journal.ensureLoaded())
  return { ...fitnessData, journal, ...storeToRefs(journal) }
}
