import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/** Tracks an element's content width so SVG charts can lay out in real pixels. */
export function useElementWidth(el: Ref<HTMLElement | null>, fallback = 300) {
  const width = ref(fallback)
  let observer: ResizeObserver | null = null

  onMounted(() => {
    if (!el.value) return
    width.value = el.value.clientWidth || fallback
    observer = new ResizeObserver(([entry]) => {
      // Hidden Ionic pages report 0; keep the last real width.
      if (entry.contentRect.width > 0) width.value = entry.contentRect.width
    })
    observer.observe(el.value)
  })
  onBeforeUnmount(() => observer?.disconnect())

  return width
}
