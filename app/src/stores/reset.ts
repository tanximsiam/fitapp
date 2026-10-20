import { useFitnessStore } from './fitness'
import { useJournalStore } from './journal'

/** Clears loaded data, e.g. after switching between demo and backend or signing out. */
export function resetDataStores() {
  useFitnessStore().$reset()
  useJournalStore().$reset()
}
