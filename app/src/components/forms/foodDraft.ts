import { FOODS, findFood, nutrientsFor, type Nutrients } from '@/data/foods'
import type { MealItem } from '@/types/journal'

/** One food row while editing. With a listed food and `manual` off, nutrients come from the food list. */
export interface FoodDraft {
  name: string
  foodId: string | null
  quantity: string
  unit: string
  manual: boolean
  energyKcal: string
  proteinG: string
  carbsG: string
  fatG: string
}

export const NUTRIENT_FIELDS = [
  { key: 'energyKcal', label: 'kcal' },
  { key: 'proteinG', label: 'Protein g' },
  { key: 'carbsG', label: 'Carbs g' },
  { key: 'fatG', label: 'Fat g' },
] as const

const str = (v: number | null) => (v == null ? '' : String(v))
/** Empty → null; anything else must be a non-negative number. */
export const num = (v: string) => (String(v).trim() === '' ? null : Number(v))

export const blankDraft = (): FoodDraft => ({ name: '', foodId: null, quantity: '', unit: '', manual: false, energyKcal: '', proteinG: '', carbsG: '', fatG: '' })

export function toDraft(i: MealItem): FoodDraft {
  const food = i.nutritionSource === 'database' ? FOODS.find((f) => f.name === i.name) : undefined
  return {
    name: i.name,
    foodId: food?.id ?? null,
    quantity: str(i.quantity),
    unit: i.unit ?? '',
    manual: !food && i.energyKcal != null,
    energyKcal: str(i.energyKcal),
    proteinG: str(i.proteinG),
    carbsG: str(i.carbsG),
    fatG: str(i.fatG),
  }
}

/** Nutrients calculated from the food list, or null when the row is manual or incomplete. */
export function calculated(d: FoodDraft): Nutrients | null {
  const food = findFood(d.foodId)
  if (!food || d.manual) return null
  return nutrientsFor(food, Number(d.quantity), d.unit || 'g')
}

export function draftError(d: FoodDraft): string {
  if (!d.name.trim()) return 'Name the food.'
  const values = [d.quantity, ...(d.manual ? [d.energyKcal, d.proteinG, d.carbsG, d.fatG] : [])].map(num)
  if (values.some((v) => v !== null && (!Number.isFinite(v) || v < 0))) return 'Amounts must be zero or more.'
  if (num(d.quantity) === 0) return 'Amount must be more than zero.'
  return ''
}

export function draftToItem(d: FoodDraft): MealItem {
  const base = { name: d.name.trim(), quantity: num(d.quantity), unit: d.unit.trim() || (d.foodId ? 'g' : null) }
  const calc = calculated(d)
  if (calc) return { ...base, ...calc, nutritionSource: 'database' }
  if (!d.manual) return { ...base, energyKcal: null, proteinG: null, carbsG: null, fatG: null, nutritionSource: null }
  const values = { energyKcal: num(d.energyKcal), proteinG: num(d.proteinG), carbsG: num(d.carbsG), fatG: num(d.fatG) }
  return { ...base, ...values, nutritionSource: Object.values(values).some((v) => v != null) ? 'entered' : null }
}
