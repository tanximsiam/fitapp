import { addDays, dateRange, daysBetween, offsetString, wallMinutes } from '@/lib/dates'
import { DEMO_WINDOW_DAYS, type DemoClock, generateDay } from './demo'
import type {
  CycleDay,
  EntryId,
  Flow,
  HydrationEntry,
  JournalAdapter,
  JournalData,
  Meal,
  MealItem,
  MoodEntry,
  Symptom,
  TrackerPrefs,
} from '@/types/journal'
import type { ISODate } from '@/types/fitness'

/**
 * Deterministic demo journal. Fixtures are generated per date (like the simulated watch), and the
 * visitor's own additions, edits and deletions are stored as an overlay in localStorage, so the
 * fixtures stay aligned with "today" while changes persist until "Reset demo".
 */

const OVERLAY_KEY = 'fitapp.demo.journal'
const PREFS_KEY = 'fitapp.demo.trackers'
/** The demo shows every tracker; a real account starts with the cycle tracker off. */
const DEMO_PREFS: TrackerPrefs = { mood: true, food: true, cycle: true }
/** Cycle history reaches further back so several completed cycles exist. */
export const DEMO_CYCLE_DAYS = 160

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), a | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const dayNo = (d: ISODate) => daysBetween('2020-01-01', d)
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(v)))
const at = (date: ISODate, minutes: number, offset: string) =>
  `${date}T${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:00${offset}`

const POSITIVE = ['calm', 'content', 'focused', 'grateful', 'energised']
const NEGATIVE = ['tired', 'stressed', 'irritable', 'anxious', 'low']

function moodFor(date: ISODate, clock: DemoClock): MoodEntry[] {
  const r = rng(dayNo(date) * 131 + 7)
  if (r() < 0.18) return [] // not every day gets a check-in
  // Energy loosely follows the simulated night's sleep, so cross-tracker patterns come from the data.
  const sleep = generateDay(date, clock).summary.sleep?.durationMin ?? 420
  const energy = clamp(3 + (sleep - 420) / 50 + (r() - 0.5) * 1.6, 1, 5)
  const mood = clamp(energy * 0.6 + 1.4 + (r() - 0.5) * 1.6, 1, 5)
  const pool = mood >= 4 ? POSITIVE : mood <= 2 ? NEGATIVE : [...POSITIVE.slice(0, 2), ...NEGATIVE.slice(0, 2)]
  const emotions = [...new Set([pool[Math.floor(r() * pool.length)], pool[Math.floor(r() * pool.length)]])]
  return [
    {
      id: `demo:mood:${date}`,
      date,
      provenance: 'simulated',
      updatedAt: null,
      recordedAt: at(date, 21 * 60 + Math.floor(r() * 50), clock.offset),
      mood,
      energy,
      stress: r() < 0.65 ? clamp(5 - mood + (r() - 0.3) * 1.5, 1, 5) : null,
      emotions,
      note: r() < 0.15 ? (mood >= 4 ? 'Good day overall.' : 'Busy day, felt drained by the evening.') : null,
    },
  ]
}

const item = (name: string, quantity: number | null, unit: string | null, kcal: number | null, p: number | null = null, c: number | null = null, f: number | null = null): MealItem => ({
  name,
  quantity,
  unit,
  energyKcal: kcal,
  proteinG: p,
  carbsG: c,
  fatG: f,
})

/** Menus with values a person might copy from packaging; some deliberately left blank. */
const MENUS: Record<Meal['mealType'], MealItem[][]> = {
  breakfast: [
    [item('Oats', 60, 'g', 228, 8, 40, 4), item('Banana', 1, 'piece', 105, 1, 27, 0)],
    [item('Eggs', 2, 'piece', 156, 13, 1, 11), item('Toast', 2, 'slice', null)],
    [item('Yogurt', 150, 'g', 95, 5, 7, 5), item('Granola', 40, 'g', null)],
  ],
  lunch: [
    [item('Rice', 180, 'g', 234, 4, 52, 0), item('Chicken curry', 1, 'serving', null)],
    [item('Lentil soup', 1, 'bowl', 230, 14, 34, 4), item('Bread', 1, 'slice', 80)],
    [item('Salad bowl', 1, 'bowl', null)],
  ],
  dinner: [
    [item('Pasta', 200, 'g', 316, 12, 62, 2), item('Tomato sauce', 100, 'g', 45)],
    [item('Fish', 150, 'g', 206, 30, 0, 9), item('Vegetables', 200, 'g', null)],
    [item('Stir-fried noodles', 1, 'plate', null)],
  ],
  snack: [[item('Apple', 1, 'piece', 95, 0, 25, 0)], [item('Nuts', 30, 'g', 180, 6, 6, 15)], [item('Biscuits', 3, 'piece', null)]],
}
const MEAL_TIMES: Record<Meal['mealType'], [number, number]> = { breakfast: [8 * 60, 0.75], lunch: [13 * 60, 0.85], snack: [16 * 60 + 30, 0.3], dinner: [20 * 60, 0.8] }

function mealsFor(date: ISODate, clock: DemoClock): Meal[] {
  const r = rng(dayNo(date) * 977 + 3)
  const sparse = dayNo(date) % 9 === 2 // some days barely logged, like real life
  return (Object.keys(MEAL_TIMES) as Meal['mealType'][]).flatMap((type) => {
    const [minute, chance] = MEAL_TIMES[type]
    if (r() > (sparse ? 0.2 : chance)) return []
    const options = MENUS[type]
    return [
      {
        id: `demo:meal:${date}:${type}`,
        date,
        provenance: 'simulated' as const,
        updatedAt: null,
        eatenAt: at(date, minute + Math.floor(r() * 30), clock.offset),
        mealType: type,
        note: null,
        items: options[Math.floor(r() * options.length)],
      },
    ]
  })
}

function hydrationFor(date: ISODate, clock: DemoClock): HydrationEntry[] {
  const r = rng(dayNo(date) * 389 + 11)
  if (r() < 0.12) return []
  const count = 3 + Math.floor(r() * 5)
  return Array.from({ length: count }, (_, i) => ({
    id: `demo:hydration:${date}:${i}`,
    date,
    provenance: 'simulated' as const,
    updatedAt: null,
    recordedAt: at(date, 8 * 60 + i * Math.floor(780 / count), clock.offset),
    volumeMl: r() < 0.3 ? 500 : 250,
  }))
}

/** Period start dates from a fixed anchor with varying cycle lengths (24–33 days). */
function periodStarts(until: ISODate): { start: ISODate; length: number; seed: number }[] {
  const out = []
  let start: ISODate = '2025-01-06'
  for (let i = 0; start <= until; i++) {
    const r = rng(i * 53 + 5)
    const cycle = 24 + Math.floor(r() * 10)
    out.push({ start, length: 4 + Math.floor(r() * 3), seed: i })
    start = addDays(start, cycle)
  }
  return out
}

function cycleDaysFor(from: ISODate, to: ISODate): CycleDay[] {
  const days: CycleDay[] = []
  for (const p of periodStarts(to)) {
    const r = rng(p.seed * 7 + 1)
    const cramps = r() < 0.8
    for (let d = 0; d < p.length; d++) {
      const date = addDays(p.start, d)
      if (date < from || date > to) continue
      const flow: Flow = d === 0 ? 'medium' : d === 1 ? 'heavy' : d < p.length - 1 ? 'light' : 'spotting'
      const symptoms: Symptom[] = []
      if (cramps && d < 2) symptoms.push('cramps')
      if (d === 0 && r() < 0.6) symptoms.push('fatigue')
      if (d === 1 && r() < 0.3) symptoms.push('headache')
      days.push({ id: `demo:cycle:${date}`, date, provenance: 'simulated', updatedAt: null, flow, symptoms, note: null })
    }
    // A pre-period symptom day now and then.
    const before = addDays(p.start, -2)
    if (r() < 0.5 && before >= from && before <= to) {
      days.push({ id: `demo:cycle:${before}`, date: before, provenance: 'simulated', updatedAt: null, flow: null, symptoms: ['bloating'], note: null })
    }
  }
  return days.sort((a, b) => a.date.localeCompare(b.date))
}

/* ---------- overlay of the visitor's own changes ---------- */

type Kind = keyof JournalData
interface Overlay {
  upserts: Record<Kind, Record<string, unknown>>
  deletes: Record<Kind, string[]>
}

const emptyOverlay = (): Overlay => ({
  upserts: { mood: {}, meals: {}, hydration: {}, cycleDays: {} },
  deletes: { mood: [], meals: [], hydration: [], cycleDays: [] },
})

function readOverlay(): Overlay {
  try {
    return { ...emptyOverlay(), ...JSON.parse(localStorage.getItem(OVERLAY_KEY) ?? '{}') }
  } catch {
    return emptyOverlay()
  }
}
const writeOverlay = (o: Overlay) => localStorage.setItem(OVERLAY_KEY, JSON.stringify(o))

function applyOverlay<T extends { id: EntryId; date: ISODate }>(kind: Kind, fixtures: T[], from: ISODate, to: ISODate, o: Overlay): T[] {
  const byId = new Map(fixtures.map((e) => [String(e.id), e]))
  for (const id of o.deletes[kind]) byId.delete(id)
  for (const [id, e] of Object.entries(o.upserts[kind]) as [string, T][]) {
    if (e.date >= from && e.date <= to) byId.set(id, e)
    else byId.delete(id)
  }
  return [...byId.values()]
}

let counter = 0
const newId = (kind: string) => `local:${kind}:${Date.now().toString(36)}${(counter++).toString(36)}`

export function resetDemoJournal() {
  localStorage.removeItem(OVERLAY_KEY)
  localStorage.removeItem(PREFS_KEY)
}

export function createDemoJournal(clock: () => DemoClock): JournalAdapter {
  const mutate = (fn: (o: Overlay) => void) => {
    const o = readOverlay()
    fn(o)
    writeOverlay(o)
  }
  const upsert = <T extends { id: EntryId }>(kind: Kind, entry: T) =>
    mutate((o) => {
      o.upserts[kind][String(entry.id)] = entry
      o.deletes[kind] = o.deletes[kind].filter((id) => id !== String(entry.id))
    })

  return {
    async list(from, to, cycleFrom) {
      const c = clock()
      const windowStart = addDays(c.today, 1 - DEMO_WINDOW_DAYS)
      const span = dateRange(from > windowStart ? from : windowStart, to < c.today ? to : c.today)
      const o = readOverlay()
      const sortBy = <T>(list: T[], key: (e: T) => string) => list.sort((a, b) => key(a).localeCompare(key(b)))
      // Sample entries for today only exist up to the current time.
      const past = <T>(list: T[], instant: (e: T) => string) => list.filter((e) => instant(e).slice(0, 10) < c.today || wallMinutes(instant(e)) <= c.nowMinutes)
      return {
        mood: sortBy(applyOverlay('mood', past(span.flatMap((d) => moodFor(d, c)), (e) => e.recordedAt), from, to, o), (e) => e.recordedAt),
        meals: sortBy(applyOverlay('meals', past(span.flatMap((d) => mealsFor(d, c)), (e) => e.eatenAt), from, to, o), (e) => e.eatenAt),
        hydration: sortBy(applyOverlay('hydration', past(span.flatMap((d) => hydrationFor(d, c)), (e) => e.recordedAt), from, to, o), (e) => e.recordedAt),
        cycleDays: sortBy(
          applyOverlay('cycleDays', cycleDaysFor(cycleFrom > addDays(c.today, -DEMO_CYCLE_DAYS) ? cycleFrom : addDays(c.today, -DEMO_CYCLE_DAYS), to < c.today ? to : c.today), cycleFrom, to, o),
          (e) => e.date,
        ),
      }
    },
    async saveMood(input, existing) {
      const date = input.recordedAt.slice(0, 10)
      upsert('mood', { ...existing, ...input, id: existing?.id ?? newId('mood'), date, provenance: 'manual', updatedAt: null } satisfies MoodEntry)
    },
    async saveMeal(input, existing) {
      const date = input.eatenAt.slice(0, 10)
      upsert('meals', { ...existing, ...input, id: existing?.id ?? newId('meal'), date, provenance: 'manual', updatedAt: null } satisfies Meal)
    },
    async saveHydration(input, existing) {
      const date = input.recordedAt.slice(0, 10)
      upsert('hydration', { ...existing, ...input, id: existing?.id ?? newId('drink'), date, provenance: 'manual', updatedAt: null } satisfies HydrationEntry)
    },
    async saveCycleDay(date, input) {
      upsert('cycleDays', { id: `demo:cycle:${date}`, date, ...input, provenance: 'manual', updatedAt: null } satisfies CycleDay)
    },
    async remove(kind, id) {
      mutate((o) => {
        delete o.upserts[kind][String(id)]
        o.deletes[kind].push(String(id))
      })
    },
    async removeCycleDay(date) {
      const id = `demo:cycle:${date}`
      mutate((o) => {
        delete o.upserts.cycleDays[id]
        o.deletes.cycleDays.push(id)
      })
    },
    async getPrefs() {
      try {
        return { ...DEMO_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') }
      } catch {
        return DEMO_PREFS
      }
    },
    async savePrefs(prefs) {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
      return prefs
    },
  }
}

/** Offset string for "now" in this browser, used when building instants for new entries. */
export const browserOffset = (d = new Date()) => offsetString(d.getTimezoneOffset())
