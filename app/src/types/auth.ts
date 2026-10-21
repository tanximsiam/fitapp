export interface User {
  id: number
  name: string
  email: string
  /** Finished the setup screens (profile, wearable, trackers, goals, connections). */
  onboarded: boolean
}

export const WEARABLE_BRANDS = ['amazfit', 'apple', 'samsung', 'google', 'garmin', 'other', 'none'] as const
export type WearableBrand = (typeof WEARABLE_BRANDS)[number]

export interface Wearable {
  brand: WearableBrand
  /** Only asked when it changes how to connect ("other"). */
  model: string | null
}

/** Backend payload shapes (snake_case), see docs/openapi.yaml. */
export interface UserPayload {
  id: number
  name: string
  email: string
  onboarded?: boolean
  birth_date?: string | null
  preferences?: { wearable?: Wearable | null }
  created_at: string | null
}
