import { barbellOutline, bicycleOutline, bodyOutline, fitnessOutline, footstepsOutline, homeOutline, speedometerOutline, walkOutline, waterOutline } from 'ionicons/icons'
import type { ActivityType } from '@/types/journal'

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
  { value: 'strength', label: 'Strength', icon: barbellOutline, met: 5 },
  { value: 'yoga', label: 'Yoga', icon: bodyOutline, met: 2.5 },
  { value: 'other', label: 'Other', icon: fitnessOutline, met: 4 },
]

export const activityKind = (type: ActivityType) => ACTIVITY_KINDS.find((k) => k.value === type) ?? ACTIVITY_KINDS[ACTIVITY_KINDS.length - 1]

/** Body weight behind the estimate. shortcut: FitApp does not ask for weight; ask for it if estimates need to be personal. */
export const REFERENCE_WEIGHT_KG = 70

/**
 * Active energy (above resting) for an activity: (MET − 1) × kg × hours, rounded to 5 kcal.
 * The same "active" meaning as the watch's active energy; the person can overwrite it.
 */
export function estimateKcal(type: ActivityType, minutes: number): number {
  return Math.round(((activityKind(type).met - 1) * REFERENCE_WEIGHT_KG * minutes) / 60 / 5) * 5
}
