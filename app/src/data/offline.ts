import { reactive } from 'vue'
import { errorMessage, isConflict, isNetworkError } from '@/api/client'
import { dateRange } from '@/lib/dates'
import { vault } from '@/lib/vault'
import { applyOutbox, enqueue, isLocalId, type NewOp, type Op } from './outbox'
import type { DaySummary, FitnessAdapter, HeartRateSample, Reading } from '@/types/fitness'
import type { ActivityEntry, CycleDay, HydrationEntry, JournalAdapter, JournalData, Meal, MoodEntry, TrackerPrefs } from '@/types/journal'

/**
 * Live (backend) data with an encrypted local copy. Reads go to the server and refresh the copy;
 * when the server cannot be reached they fall back to the copy and the UI says so. Journal writes
 * always go through the outbox, so an entry made offline appears at once and is sent later.
 * Demo mode does not use this file.
 */

/** What the UI shows about the connection. Module-level so any component can read it. */
export const connection = reactive({
  /** True while the latest request could not reach the server. */
  offline: false,
  /** When the data now on screen was saved, if it came from the local copy. */
  savedAt: null as string | null,
  queue: [] as Op[],
})

/** Account-specific folder, so one person's cache is never shown to another account. */
type Scope = () => string | null

interface Stamped<T> {
  savedAt: string
  value: T
}

async function readThrough<T>(scope: Scope, name: string, fetch: () => Promise<T>, merge?: (old: T | null, fresh: T) => T): Promise<T> {
  const s = scope()
  try {
    const fresh = await fetch()
    connection.offline = false
    connection.savedAt = null
    if (s) {
      const old = merge ? (await vault.read<Stamped<T>>(s, name))?.value ?? null : null
      await vault.write(s, name, { savedAt: new Date().toISOString(), value: merge ? merge(old, fresh) : fresh })
    }
    return fresh
  } catch (err) {
    if (!isNetworkError(err) || !s) throw err
    const saved = await vault.read<Stamped<T>>(s, name)
    if (!saved) throw err
    connection.offline = true
    connection.savedAt = saved.savedAt
    return saved.value
  }
}

/** Keeps only the most recent `max` keys of a date-keyed record. */
function recent<T>(rec: Record<string, T>, max: number): Record<string, T> {
  return Object.fromEntries(Object.entries(rec).sort(([a], [b]) => b.localeCompare(a)).slice(0, max))
}

const emptyDay = (date: string): DaySummary => ({ date, activity: null, sleep: null, heartRate: null, workouts: [], stress: null, spo2: null, skinTemp: null })

export function createCachedAdapter(inner: FitnessAdapter, scope: Scope): FitnessAdapter {
  type DayCache = { days: Record<string, DaySummary>; timezone: string }
  type PerDay<T> = Record<string, T>
  return {
    kind: 'backend',
    async getDays(from, to) {
      const cache = await readThrough<DayCache>(
        scope,
        'days',
        async () => {
          const r = await inner.getDays(from, to)
          return { days: Object.fromEntries(r.days.map((d) => [d.date, d])), timezone: r.timezone }
        },
        // Six months of days, newest kept, so earlier browsing stays available offline.
        (old, fresh) => ({ timezone: fresh.timezone, days: recent({ ...(old?.days ?? {}), ...fresh.days }, 180) }),
      )
      return { days: dateRange(from, to).map((d) => cache.days[d] ?? emptyDay(d)), timezone: cache.timezone }
    },
    async getHeartRate(date) {
      const all = await readThrough<PerDay<HeartRateSample[]>>(scope, 'heart-rate', async () => ({ [date]: await inner.getHeartRate(date) }), (old, fresh) => recent({ ...(old ?? {}), ...fresh }, 14))
      return all[date] ?? []
    },
    async getReadings(kind, date) {
      const all = await readThrough<PerDay<Reading[]>>(scope, `readings-${kind}`, async () => ({ [date]: await inner.getReadings(kind, date) }), (old, fresh) => recent({ ...(old ?? {}), ...fresh }, 14))
      return all[date] ?? []
    },
    getStatus: () => readThrough(scope, 'status', () => inner.getStatus()),
    getGoals: () => readThrough(scope, 'goals', () => inner.getGoals()),
    saveGoals: (goals) => inner.saveGoals(goals),
  }
}

export interface OfflineJournal extends JournalAdapter {
  /** Settles a change the server refused: 'mine' sends it again over the newer version, 'theirs' discards it. */
  resolve(opId: string, choice: 'mine' | 'theirs'): Promise<void>
  /** Number of changes not yet on the server, for the sign-out warning. */
  unsent(): Promise<number>
}

export function createOfflineJournal(inner: JournalAdapter, scope: Scope): OfflineJournal {
  let flushing: Promise<void> | null = null

  async function load(): Promise<Op[]> {
    const s = scope()
    // Without an account scope there is nowhere durable to keep it: the queue lives in memory only.
    if (s) connection.queue = (await vault.read<Op[]>(s, 'outbox')) ?? []
    return connection.queue
  }
  async function save(queue: Op[]) {
    connection.queue = queue
    const s = scope()
    if (s) await vault.write(s, 'outbox', queue)
  }

  async function send(op: Op) {
    if (op.kind === 'cycle') {
      if (op.action === 'save') return inner.saveCycleDay(op.date, op.input, { updatedAt: op.updatedAt } as CycleDay)
      return inner.removeCycleDay(op.date)
    }
    if (op.action === 'remove') return inner.remove(op.kind, op.targetId)
    const existing = op.action === 'update' ? ({ id: op.targetId, updatedAt: op.updatedAt } as MoodEntry & Meal & HydrationEntry & ActivityEntry) : undefined
    if (op.kind === 'mood') return inner.saveMood(op.input as never, existing)
    if (op.kind === 'meals') return inner.saveMeal(op.input as never, existing)
    if (op.kind === 'activities') return inner.saveActivity(op.input as never, existing)
    return inner.saveHydration(op.input as never, existing)
  }

  /** Sends pending changes in order. Stops at the first network failure; refused changes wait for a decision. */
  function flush(): Promise<void> {
    flushing ??= (async () => {
      let queue = await load()
      for (const op of queue.filter((q) => q.state === 'pending')) {
        try {
          await send(op)
          queue = queue.filter((q) => q.id !== op.id)
        } catch (err) {
          if (isNetworkError(err)) {
            connection.offline = true
            break
          }
          // A delete of something already gone has done its job.
          const gone = op.action === 'remove' && (err as { response?: { status?: number } }).response?.status === 404
          queue = gone
            ? queue.filter((q) => q.id !== op.id)
            : queue.map((q) => (q.id === op.id ? { ...q, state: isConflict(err) ? 'conflict' : 'rejected', error: errorMessage(err, 'The server refused this change.') } : q))
        }
        await save(queue)
      }
    })().finally(() => (flushing = null))
    return flushing
  }

  async function queueAndSend(op: NewOp) {
    const before = await load()
    const after = enqueue(before, op, { id: crypto.randomUUID(), queuedAt: new Date().toISOString() })
    // enqueue returns untouched ops as the same objects, so the new or merged one is the only stranger.
    const mine = after.find((q) => !before.includes(q))?.id
    await save(after)
    await flush()
    // Refused while online (invalid input, or edited elsewhere): tell the form now, as without the outbox.
    const refused = connection.queue.find((q) => q.id === mine && q.state !== 'pending')
    if (refused) {
      await save(connection.queue.filter((q) => q !== refused))
      throw new Error(refused.error)
    }
  }

  const entryOp = (kind: 'mood' | 'meals' | 'hydration' | 'activities', input: NewOp extends { input: infer I } ? I : never, existing?: { id: MoodEntry['id']; updatedAt: string | null }): NewOp =>
    existing
      ? ({ kind, action: 'update', targetId: existing.id, updatedAt: existing.updatedAt, input } as NewOp)
      : ({ kind, action: 'create', localId: `local-${crypto.randomUUID()}`, input } as NewOp)

  return {
    async list(from, to, cycleFrom) {
      await flush()
      const data = await readThrough<JournalData>(scope, 'journal', () => inner.list(from, to, cycleFrom))
      return applyOutbox(data, connection.queue)
    },
    saveMood: (input, existing) => queueAndSend(entryOp('mood', input as never, existing)),
    saveMeal: (input, existing) => queueAndSend(entryOp('meals', input as never, existing)),
    saveHydration: (input, existing) => queueAndSend(entryOp('hydration', input as never, existing)),
    saveActivity: (input, existing) => queueAndSend(entryOp('activities', input as never, existing)),
    saveCycleDay: (date, input, existing) =>
      queueAndSend({ kind: 'cycle', action: 'save', date, input, updatedAt: existing && !isLocalId(existing.id) ? existing.updatedAt : null }),
    remove: (kind, id) => queueAndSend({ kind, action: 'remove', targetId: id }),
    removeCycleDay: (date) => queueAndSend({ kind: 'cycle', action: 'remove', date }),
    getPrefs: () => readThrough<TrackerPrefs>(scope, 'prefs', () => inner.getPrefs()),
    savePrefs: (prefs) => inner.savePrefs(prefs),

    async resolve(opId, choice) {
      const queue = await load()
      const op = queue.find((q) => q.id === opId)
      if (!op) return
      if (choice === 'theirs') return save(queue.filter((q) => q !== op))
      // Without a token the server applies the change over whatever it has: an explicit overwrite.
      const retry = { ...op, state: 'pending', error: undefined, ...('updatedAt' in op ? { updatedAt: null } : {}) } as Op
      await save(queue.map((q) => (q === op ? retry : q)))
      await flush()
    },
    async unsent() {
      return (await load()).length
    },
  }
}
