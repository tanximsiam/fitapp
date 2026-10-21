import { describe, expect, it } from 'vitest'
import { ACTIVITY_KINDS, activityTitle, estimateKcal, estimateWorkoutKcal, workoutMinutes } from '@/data/activities'
import { exerciseMet } from '@/data/exercises'

describe('activity energy estimate', () => {
  it('uses (MET − 1) × 70 kg × hours, rounded to 5 kcal', () => {
    // Jogging, MET 7: 6 × 70 × 0.5 h = 210 kcal.
    expect(estimateKcal('jogging', 30)).toBe(210)
    // Chores, MET 3.3: 2.3 × 70 × 1 h = 161 → 160.
    expect(estimateKcal('chores', 60)).toBe(160)
    expect(estimateKcal('running', 0)).toBe(0)
  })

  it('ranks harder activities higher for the same time', () => {
    const kcal = (t: (typeof ACTIVITY_KINDS)[number]['value']) => estimateKcal(t, 45)
    expect(kcal('yoga')).toBeLessThan(kcal('walking'))
    expect(kcal('walking')).toBeLessThan(kcal('jogging'))
    expect(kcal('jogging')).toBeLessThan(kcal('running'))
  })
})

describe('workout estimate', () => {
  const sets = [
    { name: 'Bench press', sets: 3, reps: 10, durationMin: 12 },
    { name: 'push-ups', sets: 3, reps: 15, durationMin: null },
    { name: 'Something new', sets: 2, reps: null, durationMin: null },
  ]

  it('matches names regardless of case and falls back to moderate effort', () => {
    expect(exerciseMet('push-ups')).toBe(8)
    expect(exerciseMet('Something new')).toBe(5)
  })

  it('adds each exercise at its own intensity, two minutes per set when no time is given', () => {
    expect(workoutMinutes(sets)).toBe(12 + 6 + 4)
    // Bench 5 × 70 × 12/60 = 70, push-ups 7 × 70 × 6/60 = 49, new 4 × 70 × 4/60 ≈ 18.7 → 137.7 → 140.
    expect(estimateWorkoutKcal(sets)).toBe(140)
  })

  it('titles a workout by its first exercises', () => {
    expect(activityTitle({ activityType: 'workout', exercises: sets })).toBe('Workout: Bench press, push-ups +1')
    expect(activityTitle({ activityType: 'walking', exercises: [] })).toBe('Walking')
  })
})
