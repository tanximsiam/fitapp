import { describe, expect, it } from 'vitest'
import { applyOutbox, enqueue, type NewOp, type Op } from '@/data/outbox'
import type { JournalData, MoodInput } from '@/types/journal'

let n = 0
const add = (q: Op[], op: NewOp) => enqueue(q, op, { id: `q${++n}`, queuedAt: '2026-10-20T10:00:00Z' })
const mood = (m: number): MoodInput => ({ recordedAt: '2026-10-20T09:00:00+06:00', mood: m, energy: null, stress: null, emotions: [], note: null })
const server: JournalData = {
  mood: [{ id: 5, date: '2026-10-19', provenance: 'manual', updatedAt: 'T1', recordedAt: '2026-10-19T20:00:00+06:00', mood: 2, energy: null, stress: null, emotions: [], note: null }],
  meals: [],
  hydration: [],
  cycleDays: [],
}

describe('outbox', () => {
  it('shows a queued entry immediately, dated by its own local time and marked pending', () => {
    const q = add([], { kind: 'mood', action: 'create', localId: 'local-1', input: mood(4) })
    const view = applyOutbox(server, q)
    expect(view.mood.map((e) => [e.id, e.date, e.syncState])).toEqual([
      [5, '2026-10-19', undefined],
      ['local-1', '2026-10-20', 'pending'],
    ])
  })

  it('folds edits and deletes of an unsent entry into its create', () => {
    let q = add([], { kind: 'mood', action: 'create', localId: 'local-1', input: mood(4) })
    q = add(q, { kind: 'mood', action: 'update', targetId: 'local-1', updatedAt: null, input: mood(5) })
    expect(q).toHaveLength(1)
    expect(q[0].action === 'create' && (q[0].input as MoodInput).mood).toBe(5)
    expect(add(q, { kind: 'mood', action: 'remove', targetId: 'local-1' })).toEqual([])
  })

  it('keeps the first concurrency token when a server entry is edited twice offline', () => {
    let q = add([], { kind: 'mood', action: 'update', targetId: 5, updatedAt: 'T1', input: mood(3) })
    q = add(q, { kind: 'mood', action: 'update', targetId: 5, updatedAt: 'T2-local', input: mood(4) })
    expect(q).toHaveLength(1)
    expect(q[0].action === 'update' && [q[0].updatedAt, (q[0].input as MoodInput).mood]).toEqual(['T1', 4])
  })

  it('replaces a pending edit with a delete and hides the entry', () => {
    let q = add([], { kind: 'mood', action: 'update', targetId: 5, updatedAt: 'T1', input: mood(3) })
    q = add(q, { kind: 'mood', action: 'remove', targetId: 5 })
    expect(q.map((o) => o.action)).toEqual(['remove'])
    expect(applyOutbox(server, q).mood).toEqual([])
  })

  it('upserts and removes cycle days by date', () => {
    let q = add([], { kind: 'cycle', action: 'save', date: '2026-10-20', updatedAt: null, input: { flow: 'light', symptoms: [], note: null } })
    expect(applyOutbox(server, q).cycleDays.map((d) => [d.date, d.flow, d.syncState])).toEqual([['2026-10-20', 'light', 'pending']])
    q = add(q, { kind: 'cycle', action: 'remove', date: '2026-10-20' })
    expect(applyOutbox(server, q).cycleDays).toEqual([])
  })
})
