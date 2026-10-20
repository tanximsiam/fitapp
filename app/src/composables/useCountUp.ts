import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** A number that eases toward `target`: from 0 on first show, then from its current value on changes. */
export function useCountUp(target: Ref<number | null | undefined>, firstMs = 700, laterMs = 350) {
  const shown = ref(0)
  let frame = 0
  let first = true

  watch(
    target,
    (to) => {
      cancelAnimationFrame(frame)
      if (to == null || reduced()) {
        shown.value = to ?? 0
        return
      }
      const from = shown.value
      const ms = first ? firstMs : laterMs
      first = false
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / ms)
        shown.value = from + (to - from) * (1 - (1 - t) ** 3)
        if (t < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    },
    { immediate: true },
  )
  onBeforeUnmount(() => cancelAnimationFrame(frame))
  return shown
}
