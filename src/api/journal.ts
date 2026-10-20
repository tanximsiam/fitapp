import { api } from './client'
import type {
  CycleDay,
  CycleDayInput,
  EntryId,
  HydrationEntry,
  JournalAdapter,
  Meal,
  MealInput,
  MoodEntry,
  MoodInput,
  TrackerPrefs,
} from '@/types/journal'

/* Backend payloads (snake_case), see docs/openapi.yaml. */
type Meta = { id: number; date: string; provenance: 'manual'; updated_at: string | null }
type MoodPayload = Meta & { recorded_at: string; mood: number; energy: number | null; stress: number | null; emotions: string[]; note: string | null }
type ItemPayload = { name: string; quantity: number | null; unit: string | null; energy_kcal: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null; nutrition_source: 'database' | 'entered' | null }
type MealPayload = Meta & { eaten_at: string; meal_type: Meal['mealType']; note: string | null; items: ItemPayload[] }
type HydrationPayload = Meta & { recorded_at: string; volume_ml: number }
type CyclePayload = Meta & { flow: CycleDay['flow']; symptoms: CycleDay['symptoms']; note: string | null }

const meta = (p: Meta) => ({ id: p.id, date: p.date, provenance: p.provenance, updatedAt: p.updated_at })

export const toMood = (p: MoodPayload): MoodEntry => ({
  ...meta(p),
  recordedAt: p.recorded_at,
  mood: p.mood,
  energy: p.energy,
  stress: p.stress,
  emotions: p.emotions,
  note: p.note,
})

export const toMeal = (p: MealPayload): Meal => ({
  ...meta(p),
  eatenAt: p.eaten_at,
  mealType: p.meal_type,
  note: p.note,
  items: p.items.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit, energyKcal: i.energy_kcal, proteinG: i.protein_g, carbsG: i.carbs_g, fatG: i.fat_g, nutritionSource: i.nutrition_source ?? null })),
})

export const toHydration = (p: HydrationPayload): HydrationEntry => ({ ...meta(p), recordedAt: p.recorded_at, volumeMl: p.volume_ml })
export const toCycleDay = (p: CyclePayload): CycleDay => ({ ...meta(p), flow: p.flow, symptoms: p.symptoms, note: p.note })

const moodBody = (m: MoodInput) => ({ recorded_at: m.recordedAt, mood: m.mood, energy: m.energy, stress: m.stress, emotions: m.emotions, note: m.note })
const mealBody = (m: MealInput) => ({
  eaten_at: m.eatenAt,
  meal_type: m.mealType,
  note: m.note,
  items: m.items.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit, energy_kcal: i.energyKcal, protein_g: i.proteinG, carbs_g: i.carbsG, fat_g: i.fatG, nutrition_source: i.nutritionSource })),
})

async function save(path: string, body: object, existing?: { id: EntryId; updatedAt: string | null }) {
  if (existing) await api.put(`/journal/${path}/${existing.id}`, { ...body, updated_at: existing.updatedAt })
  else await api.post(`/journal/${path}`, body)
}

/** FitApp backend. Errors (including 409 conflicts) propagate to the caller. */
export function createBackendJournal(): JournalAdapter {
  return {
    async list(from, to, cycleFrom) {
      const get = <T>(path: string, f = from) => api.get<{ data: T[] }>(`/journal/${path}`, { params: { from: f, to } }).then((r) => r.data.data)
      const [mood, meals, hydration, cycle] = await Promise.all([
        get<MoodPayload>('mood'),
        get<MealPayload>('meals'),
        get<HydrationPayload>('hydration'),
        get<CyclePayload>('cycle-days', cycleFrom),
      ])
      return { mood: mood.map(toMood), meals: meals.map(toMeal), hydration: hydration.map(toHydration), cycleDays: cycle.map(toCycleDay) }
    },
    saveMood: (input, existing) => save('mood', moodBody(input), existing),
    saveMeal: (input, existing) => save('meals', mealBody(input), existing),
    saveHydration: (input, existing) => save('hydration', { recorded_at: input.recordedAt, volume_ml: input.volumeMl }, existing),
    async saveCycleDay(date, input: CycleDayInput, existing) {
      await api.put(`/journal/cycle-days/${date}`, { ...input, updated_at: existing?.updatedAt ?? null })
    },
    async remove(kind, id) {
      await api.delete(`/journal/${kind}/${id}`)
    },
    async removeCycleDay(date) {
      await api.delete(`/journal/cycle-days/${date}`)
    },
    async getPrefs() {
      return (await api.get<{ data: { preferences: { trackers: TrackerPrefs } } }>('/user')).data.data.preferences.trackers
    },
    async savePrefs(prefs) {
      return (await api.patch<{ data: { preferences: { trackers: TrackerPrefs } } }>('/user', { preferences: { trackers: prefs } })).data.data.preferences.trackers
    },
  }
}
