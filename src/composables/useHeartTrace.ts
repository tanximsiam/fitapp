import { computed, ref, watch } from 'vue'
import { wallMinutes } from '@/lib/dates'
import { useFitnessStore } from '@/stores/fitness'
import { useModeStore } from '@/stores/mode'
import type { HeartRateSample } from '@/types/fitness'

/**
 * The selected day's heart-rate readings as an SVG path in a width × 28 box (Health list row, Home tile).
 * Scaled to the readings' own time span, so a part day (today so far) still fills the box.
 */
export function useHeartTrace(width: number) {
  const fitness = useFitnessStore()
  const mode = useModeStore()
  const samples = ref<HeartRateSample[]>([])
  let request = 0

  watch(
    () => [fitness.selectedDate, mode.mode, fitness.status?.lastIngestedAt],
    async () => {
      const id = ++request
      try {
        const result = await mode.adapter.getHeartRate(fitness.selectedDate)
        if (id === request) samples.value = result
      } catch {
        // The trace is decoration beside the summary; the Heart rate page reports load errors.
        if (id === request) samples.value = []
      }
    },
    { immediate: true },
  )

  const path = computed(() => {
    const s = samples.value
    if (s.length < 2) return undefined
    const bpm = s.map((x) => x.bpm)
    const lo = Math.min(...bpm)
    const span = Math.max(1, Math.max(...bpm) - lo)
    const t0 = wallMinutes(s[0].at)
    const tSpan = Math.max(1, wallMinutes(s.at(-1)!.at) - t0)
    let prev = -Infinity
    return s
      .map((x) => {
        const m = wallMinutes(x.at)
        // Readings more than 30 minutes apart are not joined (watch off the wrist).
        const cmd = m - prev > 30 ? 'M' : 'L'
        prev = m
        return `${cmd}${(1 + ((m - t0) / tSpan) * (width - 2)).toFixed(1)},${(26 - ((x.bpm - lo) / span) * 24).toFixed(1)}`
      })
      .join('')
  })

  return { path }
}
