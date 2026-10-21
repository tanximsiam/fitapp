import { barbellOutline, bicycleOutline, bodyOutline, fitnessOutline, footstepsOutline, homeOutline, speedometerOutline, walkOutline, waterOutline } from 'ionicons/icons'
import { exerciseMet, exerciseMinutes } from '@/data/exercises'
import type { ActivityEntry, ActivityType, WorkoutExercise } from '@/types/journal'

export interface ActivityKind {
  value: ActivityType
  label: string
  icon: string
  /** Metabolic equivalent from the Compendium of Physical Activities (typical intensity). */
  met: number
}

export const ACTIVITY_KINDS: ActivityKind[] = [
  { value: 'chores', label: 'Chores', icon: homeOutline, met: 3.3 },
  { value: 'walking', label: 'Walking', icon: walkOutline, met: 3.5 },
  { value: 'jogging', label: 'Jogging', icon: footstepsOutline, met: 7 },
  { value: 'running', label: 'Running', icon: speedometerOutline, met: 9.8 },
  { value: 'cycling', label: 'Cycling', icon: bicycleOutline, met: 7.5 },
  { value: 'swimming', label: 'Swimming', icon: waterOutline, met: 6 },
  { value: 'workout', label: 'Workout', icon: barbellOutline, met: 5 },
  { value: 'yoga', label: 'Yoga', icon: bodyOutline, met: 2.5 },
  { value: 'other', label: 'Other', icon: fitnessOutline, met: 4 },
]

export const activityKind = (type: ActivityType) => ACTIVITY_KINDS.find((k) => k.value === type) ?? ACTIVITY_KINDS[ACTIVITY_KINDS.length - 1]

/** Body weight behind the estimate. shortcut: FitApp does not ask for weight; ask for it if estimates need to be personal. */
export const REFERENCE_WEIGHT_KG = 70

/** Active energy (above resting) for MET-minutes: (MET − 1) × kg × hours. Same meaning as the watch's active energy. */
const activeKcal = (met: number, minutes: number) => ((met - 1) * REFERENCE_WEIGHT_KG * minutes) / 60
const round5 = (kcal: number) => Math.round(kcal / 5) * 5

/** Estimate for a whole activity, rounded to 5 kcal; the person can overwrite it. */
export function estimateKcal(type: ActivityType, minutes: number): number {
  return round5(activeKcal(activityKind(type).met, minutes))
}

/** Estimate for a workout: each exercise at its own intensity for its own time. */
export function estimateWorkoutKcal(exercises: WorkoutExercise[]): number {
  return round5(exercises.reduce((sum, x) => sum + activeKcal(exerciseMet(x.name), exerciseMinutes(x)), 0))
}

/** Total minutes of a workout's exercises. */
export const workoutMinutes = (exercises: WorkoutExercise[]) => exercises.reduce((n, x) => n + exerciseMinutes(x), 0)

/** "Workout: Bench press, Squats +2" or the activity's name. */
export function activityTitle(a: Pick<ActivityEntry, 'activityType' | 'exercises'>): string {
  const label = activityKind(a.activityType).label
  const names = (a.exercises ?? []).map((x) => x.name)
  if (!names.length) return label
  return `${label}: ${names.slice(0, 2).join(', ')}${names.length > 2 ? ` +${names.length - 2}` : ''}`
}
