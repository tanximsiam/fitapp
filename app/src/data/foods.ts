/**
 * Built-in food list for estimating meal nutrients. Values are typical amounts per 100 g, rounded,
 * based on USDA FoodData Central (SR Legacy). Real foods vary by recipe, brand and portion, so the UI
 * labels results as estimates and lets people type their own values instead.
 */

export interface Nutrients {
  energyKcal: number
  proteinG: number
  carbsG: number
  fatG: number
}

export interface Food {
  id: string
  name: string
  /** kcal, protein g, carbs g, fat g per 100 g */
  per100g: [number, number, number, number]
  /** Grams per unit; every food also accepts "g". */
  units: Record<string, number>
}

export const FOOD_SOURCE_NOTE = 'Estimated from typical values (USDA FoodData Central, rounded). Actual food varies.'

// shortcut: drinks treat 1 ml as 1 g, close enough for milk, juice and soft drinks; add densities if oils or syrups need ml.
const ml = { ml: 1 }

export const FOODS: Food[] = [
  { id: 'rice-white', name: 'Rice, white, cooked', per100g: [130, 2.7, 28.2, 0.3], units: { cup: 158, plate: 250 } },
  { id: 'rice-brown', name: 'Rice, brown, cooked', per100g: [123, 2.7, 25.6, 1.0], units: { cup: 195 } },
  { id: 'lentils', name: 'Lentils (dal), cooked', per100g: [116, 9.0, 20.1, 0.4], units: { cup: 198, bowl: 240 } },
  { id: 'chapati', name: 'Chapati / roti, whole wheat', per100g: [297, 11.2, 46.4, 7.5], units: { piece: 40 } },
  { id: 'bread-white', name: 'Bread, white', per100g: [266, 7.6, 49.4, 3.3], units: { slice: 25 } },
  { id: 'bread-wholewheat', name: 'Bread, whole wheat', per100g: [252, 12.4, 42.7, 3.5], units: { slice: 28 } },
  { id: 'oats-dry', name: 'Oats, dry', per100g: [389, 16.9, 66.3, 6.9], units: { cup: 81, tbsp: 5 } },
  { id: 'oatmeal', name: 'Oatmeal, cooked with water', per100g: [71, 2.5, 12.0, 1.5], units: { cup: 234, bowl: 250 } },
  { id: 'cornflakes', name: 'Corn flakes', per100g: [357, 7.5, 84.1, 0.4], units: { cup: 28 } },
  { id: 'pasta', name: 'Pasta, cooked', per100g: [158, 5.8, 30.9, 0.9], units: { cup: 140, plate: 250 } },
  { id: 'potato', name: 'Potato, boiled', per100g: [87, 1.9, 20.1, 0.1], units: { piece: 150 } },
  { id: 'sweet-potato', name: 'Sweet potato, baked', per100g: [90, 2.0, 20.7, 0.2], units: { piece: 130 } },
  { id: 'fries', name: 'French fries', per100g: [312, 3.4, 41.4, 14.7], units: { serving: 117 } },
  { id: 'pizza', name: 'Pizza, cheese', per100g: [266, 11.4, 33.3, 9.7], units: { slice: 107 } },

  { id: 'egg-boiled', name: 'Egg, boiled', per100g: [155, 12.6, 1.1, 10.6], units: { piece: 50 } },
  { id: 'egg-fried', name: 'Egg, fried', per100g: [196, 13.6, 0.8, 14.8], units: { piece: 46 } },
  { id: 'chicken-breast', name: 'Chicken breast, cooked', per100g: [165, 31.0, 0, 3.6], units: { piece: 120, serving: 100 } },
  { id: 'chicken-thigh', name: 'Chicken thigh, cooked', per100g: [209, 26.0, 0, 10.9], units: { piece: 70 } },
  { id: 'beef-mince', name: 'Beef mince, cooked (85% lean)', per100g: [250, 25.9, 0, 15.4], units: { serving: 100 } },
  { id: 'salmon', name: 'Salmon, cooked', per100g: [206, 22.1, 0, 12.4], units: { fillet: 150 } },
  { id: 'white-fish', name: 'White fish, cooked', per100g: [105, 22.8, 0, 0.9], units: { fillet: 150, piece: 80 } },
  { id: 'tuna', name: 'Tuna, canned in water', per100g: [116, 25.5, 0, 0.8], units: { can: 120 } },
  { id: 'shrimp', name: 'Shrimp, cooked', per100g: [99, 24.0, 0.2, 0.3], units: { serving: 85 } },
  { id: 'tofu', name: 'Tofu, firm', per100g: [144, 17.3, 2.8, 8.7], units: { serving: 100 } },
  { id: 'chickpeas', name: 'Chickpeas, cooked', per100g: [164, 8.9, 27.4, 2.6], units: { cup: 164 } },
  { id: 'kidney-beans', name: 'Kidney beans, cooked', per100g: [127, 8.7, 22.8, 0.5], units: { cup: 177 } },
  { id: 'hummus', name: 'Hummus', per100g: [166, 7.9, 14.3, 9.6], units: { tbsp: 15 } },

  { id: 'milk-whole', name: 'Milk, whole', per100g: [61, 3.2, 4.8, 3.3], units: { ...ml, glass: 250, cup: 244 } },
  { id: 'milk-skim', name: 'Milk, skim', per100g: [34, 3.4, 5.0, 0.1], units: { ...ml, glass: 250, cup: 245 } },
  { id: 'yogurt', name: 'Yogurt, plain', per100g: [61, 3.5, 4.7, 3.3], units: { cup: 245, tbsp: 15 } },
  { id: 'greek-yogurt', name: 'Greek yogurt, plain, nonfat', per100g: [59, 10.2, 3.6, 0.4], units: { cup: 245, tbsp: 15 } },
  { id: 'cheddar', name: 'Cheddar cheese', per100g: [403, 24.9, 1.3, 33.1], units: { slice: 28 } },
  { id: 'butter', name: 'Butter', per100g: [717, 0.9, 0.1, 81.1], units: { tbsp: 14, tsp: 5 } },
  { id: 'olive-oil', name: 'Olive oil', per100g: [884, 0, 0, 100], units: { tbsp: 13.5, tsp: 4.5 } },
  { id: 'peanut-butter', name: 'Peanut butter', per100g: [588, 25.1, 20.0, 50.4], units: { tbsp: 16 } },

  { id: 'apple', name: 'Apple', per100g: [52, 0.3, 13.8, 0.2], units: { piece: 182 } },
  { id: 'banana', name: 'Banana', per100g: [89, 1.1, 22.8, 0.3], units: { piece: 118 } },
  { id: 'orange', name: 'Orange', per100g: [47, 0.9, 11.8, 0.1], units: { piece: 131 } },
  { id: 'mango', name: 'Mango', per100g: [60, 0.8, 15.0, 0.4], units: { piece: 200, cup: 165 } },
  { id: 'grapes', name: 'Grapes', per100g: [69, 0.7, 18.1, 0.2], units: { cup: 151 } },
  { id: 'watermelon', name: 'Watermelon', per100g: [30, 0.6, 7.6, 0.2], units: { cup: 152, slice: 280 } },
  { id: 'avocado', name: 'Avocado', per100g: [160, 2.0, 8.5, 14.7], units: { piece: 150 } },

  { id: 'broccoli', name: 'Broccoli, cooked', per100g: [35, 2.4, 7.2, 0.4], units: { cup: 156 } },
  { id: 'spinach', name: 'Spinach, raw', per100g: [23, 2.9, 3.6, 0.4], units: { cup: 30 } },
  { id: 'carrot', name: 'Carrot, raw', per100g: [41, 0.9, 9.6, 0.2], units: { piece: 61 } },
  { id: 'tomato', name: 'Tomato', per100g: [18, 0.9, 3.9, 0.2], units: { piece: 123 } },
  { id: 'cucumber', name: 'Cucumber', per100g: [15, 0.7, 3.6, 0.1], units: { cup: 104, piece: 300 } },

  { id: 'almonds', name: 'Almonds', per100g: [579, 21.2, 21.6, 49.9], units: { handful: 28 } },
  { id: 'peanuts', name: 'Peanuts, roasted', per100g: [585, 24.4, 21.3, 49.7], units: { handful: 28 } },
  { id: 'cashews', name: 'Cashews', per100g: [553, 18.2, 30.2, 43.9], units: { handful: 28 } },
  { id: 'dark-chocolate', name: 'Dark chocolate (70–85%)', per100g: [598, 7.8, 45.9, 42.6], units: { square: 10 } },
  { id: 'cookie', name: 'Chocolate chip cookie', per100g: [488, 5.4, 64.1, 24.3], units: { piece: 16 } },
  { id: 'sugar', name: 'Sugar', per100g: [387, 0, 100, 0], units: { tsp: 4.2, tbsp: 12.5 } },
  { id: 'honey', name: 'Honey', per100g: [304, 0.3, 82.4, 0], units: { tsp: 7, tbsp: 21 } },

  { id: 'orange-juice', name: 'Orange juice', per100g: [45, 0.7, 10.4, 0.2], units: { ...ml, glass: 250 } },
  { id: 'cola', name: 'Cola', per100g: [42, 0, 10.6, 0], units: { ...ml, can: 355, glass: 250 } },
  { id: 'coffee', name: 'Coffee, black', per100g: [1, 0.1, 0, 0], units: { ...ml, cup: 240 } },
  { id: 'tea', name: 'Tea, black', per100g: [1, 0, 0.3, 0], units: { ...ml, cup: 240 } },
]

export const findFood = (id: string | null | undefined) => FOODS.find((f) => f.id === id)

/** Units a food can be measured in, grams first. */
export const unitsOf = (food: Food) => ['g', ...Object.keys(food.units)]

/** Nutrients for an amount; kcal rounded to whole numbers, grams to one decimal. Null for unknown units. */
export function nutrientsFor(food: Food, amount: number, unit: string): Nutrients | null {
  const grams = unit === 'g' ? 1 : food.units[unit]
  if (grams == null || !Number.isFinite(amount) || amount <= 0) return null
  const factor = (amount * grams) / 100
  const [kcal, p, c, f] = food.per100g
  const one = (n: number) => Math.round(n * factor * 10) / 10
  return { energyKcal: Math.round(kcal * factor), proteinG: one(p), carbsG: one(c), fatG: one(f) }
}

/** Matches whole words first, then anywhere in the name. */
export function searchFoods(query: string, limit = 8): Food[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const words = (f: Food) => f.name.toLowerCase().split(/[^a-z0-9]+/)
  const rank = (f: Food) => (f.name.toLowerCase().startsWith(q) ? 0 : words(f).some((w) => w.startsWith(q)) ? 1 : f.name.toLowerCase().includes(q) ? 2 : 9)
  return FOODS.map((f) => [f, rank(f)] as const)
    .filter(([, r]) => r < 9)
    .sort((a, b) => a[1] - b[1] || a[0].name.localeCompare(b[0].name))
    .slice(0, limit)
    .map(([f]) => f)
}
