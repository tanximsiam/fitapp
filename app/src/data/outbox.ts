import type { ISODate } from '@/types/fitness'
import type {
  CycleDay,
  CycleDayInput,
  EntryId,
  HydrationEntry,
  HydrationInput,
  JournalData,
  Meal,
  MealInput,
  MoodEntry,
  MoodInput,
  SyncState,
} from '@/types/journal'

/**
 * Journal writes waiting for the server. Pure functions only: the offline journal (data/offline.ts)
 * persists the queue and sends it; this file decides how operations merge and how they show up locally.
 */

export type EntryKind = 'mood' | 'meals' | 'hydration'
type EntryInput = { mood: MoodInput; meals: MealInput; hydration: HydrationInput }

interface Base {
  /** Queue id. */
  id: string
  queuedAt: string
  state: SyncState
  /** Server message when state is 'conflict' or 'rejected'. */
  error?: string
}

export type Op = Base &
  (
    | { kind: EntryKind; action: 'create'; localId: string; input: EntryInput[EntryKind] }
    | { kind: EntryKind; action: 'update'; targetId: EntryId; updatedAt: string | null; input: EntryInput[EntryKind] }
    | { kind: EntryKind; action: 'remove'; targetId: EntryId }
    | { kind: 'cycle'; action: 'save'; date: ISODate; updatedAt: string | null; input: CycleDayInput }
    | { kind: 'cycle'; action: 'remove'; date: ISODate }
  )

export type NewOp = Op extends infer O ? (O extends Op ? Omit<O, 'id' | 'queuedAt' | 'state' | 'error'> : never) : never

export const isLocalId = (id: EntryId) => typeof id === 'string' && id.startsWith('local-')

const sameTarget = (a: Op, b: NewOp) =>
  a.kind === b.kind &&
  (a.kind === 'cycle'
    ? 'date' in b && a.date === b.date
    : ('targetId' in a && 'targetId' in b && a.targetId === b.targetId) || ('localId' in a && 'targetId' in b && a.localId === b.targetId))

/**
 * Adds an operation, folding it into an earlier one for the same record so the server sees at most
 * one change per record: editing an unsent entry rewrites its create, deleting it cancels the create,
 * and a second edit replaces the first (keeping the first's concurrency token).
 */
export function enqueue(queue: Op[], op: NewOp, meta: { id: string; queuedAt: string }): Op[] {
  const prev = queue.find((q) => q.state === 'pending' && sameTarget(q, op))
  const fresh = { ...op, ...meta, state: 'pending' } as Op
  if (!prev) return [...queue, fresh]

  const rest = queue.filter((q) => q !== prev)
  if (prev.action === 'create') {
    if (op.action === 'remove') return rest
    if (op.action === 'update') return queue.map((q) => (q === prev ? ({ ...prev, input: op.input } as Op) : q))
  }
  if (prev.action === 'update' && op.action === 'update') return queue.map((q) => (q === prev ? ({ ...prev, input: op.input } as Op) : q))
  if (prev.kind === 'cycle' && prev.action === 'save' && op.kind === 'cycle' && op.action === 'save')
    return queue.map((q) => (q === prev ? ({ ...prev, input: op.input } as Op) : q))
  // remove after update, or save after remove: the later intent wins, keeping the earlier token.
  const token = 'updatedAt' in prev ? prev.updatedAt : null
  return [...rest, ('updatedAt' in fresh ? { ...fresh, updatedAt: token } : fresh) as Op]
}

const entryDate = (iso: string) => iso.slice(0, 10)

function build(kind: EntryKind, id: EntryId, input: EntryInput[EntryKind], state: SyncState, updatedAt: string | null) {
  const meta = { id, provenance: 'manual' as const, updatedAt, syncState: state }
  if (kind === 'mood') return { ...meta, ...(input as MoodInput), date: entryDate((input as MoodInput).recordedAt) } as MoodEntry
  if (kind === 'meals') return { ...meta, ...(input as MealInput), date: entryDate((input as MealInput).eatenAt) } as Meal
  return { ...meta, ...(input as HydrationInput), date: entryDate((input as HydrationInput).recordedAt) } as HydrationEntry
}

/** The server's records with the queued changes shown on top, each marked with its sync state. */
export function applyOutbox(data: JournalData, queue: Op[]): JournalData {
  const out: JournalData = { mood: [...data.mood], meals: [...data.meals], hydration: [...data.hydration], cycleDays: [...data.cycleDays] }
  const list = (k: EntryKind) => (k === 'mood' ? 'mood' : k) as 'mood' | 'meals' | 'hydration'
  for (const op of queue) {
    if (op.kind === 'cycle') {
      out.cycleDays = out.cycleDays.filter((d) => d.date !== op.date)
      if (op.action === 'save') out.cycleDays.push({ id: `local-cycle-${op.date}`, date: op.date, provenance: 'manual', updatedAt: op.updatedAt, syncState: op.state, ...op.input } as CycleDay)
      continue
    }
    const key = list(op.kind)
    const arr = out[key] as (MoodEntry | Meal | HydrationEntry)[]
    if (op.action === 'create') arr.push(build(op.kind, op.localId, op.input, op.state, null))
    else if (op.action === 'update') {
      const i = arr.findIndex((e) => e.id === op.targetId)
      const entry = build(op.kind, op.targetId, op.input, op.state, op.updatedAt)
      if (i >= 0) arr[i] = entry
      else arr.push(entry)
    } else (out[key] as unknown[]) = arr.filter((e) => e.id !== op.targetId)
  }
  return out
}

/** One line describing a queued change, for the "needs your decision" list. */
export function describeOp(op: Op): string {
  const what = { mood: 'Mood check-in', meals: 'Meal', hydration: 'Drink', cycle: 'Period day' }[op.kind]
  if (op.kind === 'cycle') return `${what} ${op.date}${op.action === 'remove' ? ' (deleted)' : ''}`
  if (op.action === 'remove') return `${what} (deleted)`
  const input = op.input as Partial<MoodInput & MealInput & HydrationInput>
  const at = input.recordedAt ?? input.eatenAt ?? ''
  return `${what}, ${at.slice(0, 10)} ${at.slice(11, 16)}`
}
