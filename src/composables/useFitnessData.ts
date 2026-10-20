import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useFitnessStore } from '@/stores/fitness'
import { useModeStore } from '@/stores/mode'
import { formatRelative, formatShortDate } from '@/lib/format'

/** Shared page behaviour: load once, expose state and a freshness line. */
export function useFitnessData() {
  const fitness = useFitnessStore()
  const mode = useModeStore()
  onMounted(() => fitness.ensureLoaded())

  const freshness = computed(() => {
    const s = fitness.status
    if (mode.isDemo) return 'Sample data, simulated on this device'
    if (!s) return ''
    if (!s.lastIngestedAt) return 'No uploads yet'
    const latest = s.latestDate ? ` · latest data ${formatShortDate(s.latestDate)}` : ''
    return `Last upload ${formatRelative(s.lastIngestedAt)}${latest}`
  })

  const hasData = (date: string) => {
    const d = fitness.days.find((x) => x.date === date)
    return !!d && (d.activity !== null || d.sleep !== null || d.heartRate !== null)
  }

  return { fitness, mode, freshness, hasData, ...storeToRefs(fitness) }
}
