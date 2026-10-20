// @vitest-environment node
/**
 * API contract tests against a real FitApp backend (scripts/contract-backend.sh).
 * They go through the app's own API client and mappers, so a renamed or missing field fails here.
 * Skipped unless the contract backend is running.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { AxiosError } from 'axios'
import * as authApi from '@/api/auth'
import { api, isConflict } from '@/api/client'
import * as fitnessApi from '@/api/fitness'
import { createBackendJournal } from '@/api/journal'
import { connection, createOfflineJournal } from '@/data/offline'
import type { JournalAdapter, MoodInput } from '@/types/journal'

const envFile = resolve(__dirname, '../../.contract.env')
const env: Record<string, string> = existsSync(envFile)
  ? Object.fromEntries(readFileSync(envFile, 'utf8').trim().split('\n').map((l) => l.split(/=(.*)/s).slice(0, 2)))
  : {}
const URL = process.env.FITAPP_CONTRACT_URL ?? env.FITAPP_CONTRACT_URL

const mood = (m: number, note: string | null = null): MoodInput => ({ recordedAt: '2026-10-17T09:30:00+06:00', mood: m, energy: 3, stress: 2, emotions: ['calm'], note })
const journal = createBackendJournal()
const listOct = () => journal.list('2026-10-15', '2026-10-18', '2026-09-01')

describe.skipIf(!URL)('FitApp API contract', () => {
  beforeAll(async () => {
    // Node, not jsdom: jsdom's XHR applies browser CORS rules, which say nothing about the API contract.
    api.defaults.adapter = 'http'
    api.defaults.baseURL = `${URL}/api`
    const { token, user } = await authApi.login(env.FITAPP_CONTRACT_EMAIL ?? process.env.FITAPP_CONTRACT_EMAIL!, env.FITAPP_CONTRACT_PASSWORD ?? process.env.FITAPP_CONTRACT_PASSWORD!)
    api.defaults.headers.common.Authorization = `Bearer ${token}`
    expect(user).toEqual({ id: expect.any(Number), name: 'Contract Test', email: 'contract@fitapp.test' })
  })

  it('returns the signed-in user', async () => {
    expect((await authApi.fetchCurrentUser()).email).toBe('contract@fitapp.test')
  })

  it('reports the ingested source in the status', async () => {
    const s = await fitnessApi.getStatus()
    expect(s.sources).toEqual([expect.objectContaining({ key: 'my-bridge', name: 'My export bridge', device: 'Example watch' })])
    expect(s.sources[0].measurements).toContain('heart_rate')
    expect(s.lastIngestedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    // The account's own zone (the test user's default), not the payload's.
    expect(s.timezone).toMatch(/^(UTC|[A-Za-z_]+\/[A-Za-z_/]+)$/)
  })

  it('maps day summaries, keeping unmeasured values null', async () => {
    const { days, timezone } = await fitnessApi.getDays('2026-10-16', '2026-10-17')
    expect(timezone).toBe((await fitnessApi.getStatus()).timezone)
    const [d16, d17] = days
    expect(d16.date).toBe('2026-10-16')
    expect(d16.activity).toEqual({ steps: 9412, distanceM: 6870, activeKcal: 486, activeMinutes: 58, source: 'my-bridge' })
    expect(d16.workouts[0]).toEqual(expect.objectContaining({ type: 'running', durationMin: 42, distanceM: 5200, avgBpm: 142 }))
    expect(d17.activity?.activeMinutes).toBeNull()
    // Instants come back in the account's zone; the moment must match what the device sent.
    expect(Date.parse(d17.sleep!.startAt)).toBe(Date.parse('2026-10-16T23:42:00+06:00'))
    expect(d17.sleep).toEqual(expect.objectContaining({ durationMin: 444, score: 81, stages: { deepMin: 82, lightMin: 228, remMin: 96, awakeMin: 38 } }))
  })

  it('reads goals in app units', async () => {
    expect(await fitnessApi.getGoals()).toEqual({ steps: expect.any(Number), activeKcal: expect.any(Number), distanceM: expect.any(Number), sleepMin: expect.any(Number) })
  })

  it('creates, updates, and deletes a mood entry with a concurrency token', async () => {
    await journal.saveMood(mood(4, 'contract'))
    const created = (await listOct()).mood.find((e) => e.note === 'contract')!
    expect(created).toEqual(expect.objectContaining({ date: '2026-10-17', provenance: 'manual', mood: 4, updatedAt: expect.any(String) }))

    await journal.saveMood(mood(5, 'contract'), created)
    const updated = (await listOct()).mood.find((e) => e.id === created.id)!
    expect(updated.mood).toBe(5)

    await journal.remove('mood', created.id)
    expect((await listOct()).mood.some((e) => e.id === created.id)).toBe(false)
  })

  it('refuses an edit made from a stale copy with 409', async () => {
    await journal.saveMood(mood(3, 'stale'))
    const first = (await listOct()).mood.find((e) => e.note === 'stale')!
    await new Promise((r) => setTimeout(r, 1100)) // updated_at has one-second precision
    await journal.saveMood(mood(4, 'stale'), first)
    const err = await journal.saveMood(mood(1, 'stale'), first).catch((e) => e)
    expect(isConflict(err)).toBe(true)
    await journal.remove('mood', first.id)
  })

  it('upserts and deletes a cycle day by date', async () => {
    await journal.saveCycleDay('2026-10-16', { flow: 'light', symptoms: ['cramps'], note: null })
    const day = (await listOct()).cycleDays.find((d) => d.date === '2026-10-16')!
    expect(day).toEqual(expect.objectContaining({ flow: 'light', symptoms: ['cramps'], updatedAt: expect.any(String) }))
    await journal.removeCycleDay('2026-10-16')
    expect((await listOct()).cycleDays.some((d) => d.date === '2026-10-16')).toBe(false)
  })

  it('queues an offline edit, holds back the conflict, and applies "keep mine" when chosen', async () => {
    let offline = false
    const down = () => Promise.reject(new AxiosError('Network Error', 'ERR_NETWORK'))
    const flaky: JournalAdapter = { ...journal, saveMood: (i, e) => (offline ? down() : journal.saveMood(i, e)) }
    const phone = createOfflineJournal(flaky, () => null)

    await journal.saveMood(mood(2, 'race'))
    const seen = (await listOct()).mood.find((e) => e.note === 'race')!

    // This phone edits while offline: queued, shown at once as waiting to sync.
    offline = true
    await phone.saveMood(mood(5, 'race'), seen)
    expect(connection.queue.map((q) => q.state)).toEqual(['pending'])

    // Meanwhile another device changes the same entry.
    await new Promise((r) => setTimeout(r, 1100))
    await journal.saveMood(mood(1, 'race'), seen)

    // Back online: the queued edit is refused and waits, nothing is overwritten.
    offline = false
    const view = await phone.list('2026-10-15', '2026-10-18', '2026-09-01')
    expect(connection.queue.map((q) => q.state)).toEqual(['conflict'])
    expect(view.mood.find((e) => e.id === seen.id)?.syncState).toBe('conflict')
    expect((await listOct()).mood.find((e) => e.id === seen.id)?.mood).toBe(1)

    await phone.resolve(connection.queue[0].id, 'mine')
    expect(connection.queue).toEqual([])
    expect((await listOct()).mood.find((e) => e.id === seen.id)?.mood).toBe(5)
    await journal.remove('mood', seen.id)
  })
})
