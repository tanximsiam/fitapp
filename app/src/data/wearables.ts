import type { WearableBrand } from '@/types/auth'

export type Platform = 'android' | 'ios'

/**
 * How a watch family's data reaches FitApp on each phone platform:
 * - 'direct': FitApp pairs with the watch itself (the FitApp watch connection layer).
 * - 'share': the watch's own app writes to Health Connect or Apple Health, and FitApp reads from there.
 * - 'built-in': the data is already in the platform store (Apple Watch on iPhone).
 * - a string: why this combination does not work, shown as-is.
 */
export type Route = 'direct' | 'share' | 'built-in' | string

export interface WearableInfo {
  brand: WearableBrand
  name: string
  /** Shorter name for headings ("Connect your Garmin"). */
  short: string
  /** The companion app that shares the data, when there is one. */
  app: string | null
  routes: Record<Platform, Route[]>
}

export const WEARABLES: WearableInfo[] = [
  { brand: 'amazfit', name: 'Amazfit / Zepp', short: 'Amazfit', app: 'Zepp', routes: { android: ['share'], ios: ['share'] } },
  { brand: 'apple', name: 'Apple Watch', short: 'Apple Watch', app: null, routes: { android: ['Apple Watch works only with an iPhone. Install FitApp on your iPhone instead.'], ios: ['built-in'] } },
  {
    brand: 'samsung',
    name: 'Samsung Galaxy Watch',
    short: 'Galaxy Watch',
    app: 'Samsung Health',
    routes: { android: ['share'], ios: ['Galaxy Watch does not pair with an iPhone, so its data never reaches Apple Health.'] },
  },
  {
    brand: 'google',
    name: 'Google Pixel Watch / Fitbit',
    short: 'Pixel Watch or Fitbit',
    app: 'Fitbit',
    routes: { android: ['share'], ios: ['The Fitbit app does not share with Apple Health. Use FitApp on an Android phone for this watch.'] },
  },
  { brand: 'garmin', name: 'Garmin', short: 'Garmin', app: 'Garmin Connect', routes: { android: ['share'], ios: ['share'] } },
  { brand: 'other', name: 'Other wearable', short: 'wearable', app: null, routes: { android: ['share'], ios: ['share'] } },
]

/** No wearable: the phone's own step count through the platform store. */
export const PHONE_ONLY: WearableInfo = { brand: 'none', name: 'No wearable', short: 'phone', app: null, routes: { android: ['built-in'], ios: ['built-in'] } }

export const wearableInfo = (brand: WearableBrand | null | undefined) => WEARABLES.find((w) => w.brand === brand) ?? PHONE_ONLY
