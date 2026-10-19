import { cafeOutline, moonOutline, nutritionOutline, sunnyOutline } from 'ionicons/icons'
import type { Flow, MealType } from '@/types/journal'
import type { GlyphKind } from './ChoiceGlyph.vue'

export interface Choice<T> {
  value: T
  label: string
  color: string
  hint?: string
  glyph?: { kind: GlyphKind; level: number }
  icon?: string
}

const scale = (kind: GlyphKind, labels: string[], colors: string[]): Choice<number>[] =>
  labels.map((label, i) => ({ value: i + 1, label, color: colors[i], glyph: { kind, level: i + 1 } }))

export const MOOD_CHOICES = scale('face', ['Very low', 'Low', 'Okay', 'Good', 'Great'], ['#7c8db5', '#93a8d4', '#d9b44a', '#f2a03d', '#ef7b45'])
export const ENERGY_CHOICES = scale('battery', ['Drained', 'Low', 'Steady', 'Good', 'High'], ['#e5534b', '#f08c3a', '#f2c230', '#8acb4d', '#34b56a'])
export const STRESS_CHOICES = scale('gauge', ['None', 'Mild', 'Some', 'High', 'Very high'], ['#34b56a', '#8acb4d', '#f2c230', '#f08c3a', '#e5534b'])

const FLOW_COLOR = '#d6455d'
export const FLOW_CHOICES: Choice<Flow | null>[] = (['none', 'spotting', 'light', 'medium', 'heavy'] as const).map((f, i) => ({
  value: f === 'none' ? null : f,
  label: f[0].toUpperCase() + f.slice(1),
  color: FLOW_COLOR,
  glyph: { kind: 'drops', level: i },
}))

const WATER = '#3a8fe0'
export const DRINK_CHOICES: Choice<number>[] = [
  { value: 150, label: 'Cup', hint: '150 ml', color: WATER, glyph: { kind: 'glass', level: 150 } },
  { value: 250, label: 'Glass', hint: '250 ml', color: WATER, glyph: { kind: 'glass', level: 250 } },
  { value: 330, label: 'Can', hint: '330 ml', color: WATER, glyph: { kind: 'glass', level: 330 } },
  { value: 500, label: 'Bottle', hint: '500 ml', color: WATER, glyph: { kind: 'glass', level: 500 } },
]

export const MEAL_CHOICES: Choice<MealType>[] = [
  { value: 'breakfast', label: 'Breakfast', color: '#d48a12', icon: cafeOutline },
  { value: 'lunch', label: 'Lunch', color: '#e0662f', icon: sunnyOutline },
  { value: 'dinner', label: 'Dinner', color: '#6250d6', icon: moonOutline },
  { value: 'snack', label: 'Snack', color: '#2f9e5e', icon: nutritionOutline },
]
