import { ref, watch } from 'vue'

export type HomeCardId = 'goals' | 'health' | 'wellbeing' | 'timeline'
export interface HomeCard {
  id: HomeCardId
  visible: boolean
}

export const HOME_CARDS: { id: HomeCardId; label: string; hint: string; /** Watch measurements stay on Home. */ locked?: boolean }[] = [
  { id: 'goals', label: 'Goals', hint: 'Steps, activity and sleep against your goals' },
  { id: 'health', label: "Today's health", hint: 'Heart rate, distance, sleep, stress and oxygen', locked: true },
  { id: 'wellbeing', label: 'Journal', hint: 'Mood, meals, water and cycle today' },
  { id: 'timeline', label: 'Today so far', hint: 'Everything recorded today, in order' },
]

const KEY = 'fitapp.homeLayout'
export const DEFAULT_LAYOUT: HomeCard[] = HOME_CARDS.map((c) => ({ id: c.id, visible: true }))

/**
 * Restores a saved layout: unknown ids are dropped, cards added in later versions are appended,
 * and locked cards are always visible.
 */
export function normalizeLayout(saved: unknown): HomeCard[] {
  const known = new Set(HOME_CARDS.map((c) => c.id))
  const locked = new Set(HOME_CARDS.filter((c) => c.locked).map((c) => c.id))
  const list = Array.isArray(saved) ? saved : []
  const out: HomeCard[] = []
  for (const c of list) {
    if (c && known.has(c.id) && !out.some((o) => o.id === c.id)) out.push({ id: c.id, visible: locked.has(c.id) || c.visible !== false })
  }
  for (const c of DEFAULT_LAYOUT) if (!out.some((o) => o.id === c.id)) out.push({ ...c })
  return out
}

function read(): HomeCard[] {
  try {
    return normalizeLayout(JSON.parse(localStorage.getItem(KEY) ?? 'null'))
  } catch {
    return normalizeLayout(null)
  }
}

/** Shared across the app so the editor and Home stay in step. */
const layout = ref<HomeCard[]>(read())
watch(
  layout,
  (v) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(v))
    } catch {
      // Storage unavailable: the layout lasts for this session.
    }
  },
  { deep: true },
)

export function useHomeLayout() {
  return {
    layout,
    reset: () => (layout.value = DEFAULT_LAYOUT.map((c) => ({ ...c }))),
  }
}
