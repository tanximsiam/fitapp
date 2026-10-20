import { describe, expect, it } from 'vitest'
import { assignMeasurements, localDate, platformRecords, workoutType } from '@/sources/normalize'

describe('health platform normalisation', () => {
  it('reads Android day buckets as local dates and iOS instants in local time', () => {
    expect(localDate('2026-10-17T00:00')).toBe('2026-10-17')
    const d = new Date(2026, 9, 17, 0, 30) // 00:30 local on Oct 17
    expect(localDate(d.toISOString())).toBe('2026-10-17')
  })

  it('maps platform workout names to the ingest vocabulary', () => {
    expect(workoutType('RUNNING')).toBe('running')
    expect(workoutType('biking')).toBe('cycling')
    expect(workoutType('traditionalStrengthTraining')).toBe('strength')
    expect(workoutType(undefined)).toBe('other')
    expect(workoutType('42')).toBe('other')
  })

  it('builds daily activity and workouts, leaving unmeasured values null and dropping empty days', () => {
    const r = platformRecords(
      {
        steps: [{ startDate: '2026-10-16T00:00', value: 9412.4 }, { startDate: '2026-10-17T00:00', value: 0 }],
        activeKcal: [{ startDate: '2026-10-16T00:00', value: 486.2 }],
        workouts: [
          {
            startDate: '2026-10-16T12:10:00Z',
            endDate: '2026-10-16T12:52:00Z',
            workoutType: 'RUNNING',
            calories: 310,
            distance: 0,
            heartRate: [{ timestamp: '2026-10-16T12:11:00Z', bpm: 140 }, { timestamp: '2026-10-16T12:20:00Z', bpm: 168 }, { timestamp: '2026-10-16T12:21:00Z', bpm: 0 }],
          },
        ],
      },
      ['steps', 'active_energy', 'workouts', 'heart_rate'],
    )
    expect(r.activity).toEqual([{ date: '2026-10-16', steps: 9412, active_kcal: 486 }])
    expect(r.workouts?.[0]).toEqual(expect.objectContaining({ type: 'running', active_kcal: 310, distance_m: null, avg_bpm: 154, max_bpm: 168, start_at: '2026-10-16T12:10:00.000Z' }))
    expect(r.heart_rate?.samples).toHaveLength(2)
  })

  it('reads only the measurements assigned to the source', () => {
    const r = platformRecords({ steps: [{ startDate: '2026-10-16T00:00', value: 100 }], workouts: [{ startDate: '2026-10-16T12:10:00Z', endDate: '2026-10-16T12:20:00Z' }] }, ['workouts'])
    expect(r.activity).toBeUndefined()
    expect(r.workouts).toHaveLength(1)
  })

  it('gives each measurement to the first connected source that has it', () => {
    expect(
      assignMeasurements([
        { id: 'fitapp-watch', granted: ['steps', 'sleep', 'heart_rate'] },
        { id: 'health-connect', granted: ['steps', 'active_energy', 'workouts', 'heart_rate'] },
      ]),
    ).toEqual({ 'fitapp-watch': ['steps', 'sleep', 'heart_rate'], 'health-connect': ['active_energy', 'workouts'] })
  })
})
