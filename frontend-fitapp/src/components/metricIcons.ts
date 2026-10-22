import {
  barbellOutline,
  batteryHalfOutline,
  bedOutline,
  calendarOutline,
  flameOutline,
  footstepsOutline,
  happyOutline,
  heartOutline,
  layersOutline,
  mapOutline,
  moonOutline,
  restaurantOutline,
  speedometerOutline,
  thermometerOutline,
  timerOutline,
  walkOutline,
  waterOutline,
} from 'ionicons/icons'

/** Blood oxygen as O₂: a drawn O with a subscript 2, in the outline style of the other icons (no font needed). */
// Ionicons decodes URL-encoded SVG only in the plain "data:image/svg+xml," form.
const O2 = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="36" stroke-linecap="round" stroke-linejoin="round"><circle cx="196" cy="224" r="132"/><path d="M352 352a56 56 0 1 1 104 30L352 464h112"/></svg>',
)}`

/**
 * One icon per measurement, used everywhere it is named so people learn them once.
 * Activity (the page) uses a walking figure; steps (the metric) keep the footsteps.
 */
export const ICONS = {
  activity: walkOutline,
  steps: footstepsOutline,
  distance: mapOutline,
  activeEnergy: flameOutline,
  activeTime: timerOutline,
  workouts: barbellOutline,
  sleep: moonOutline,
  bedtime: bedOutline,
  heartRate: heartOutline,
  stress: speedometerOutline,
  spo2: O2,
  skinTemp: thermometerOutline,
  mood: happyOutline,
  energy: batteryHalfOutline,
  meals: restaurantOutline,
  water: waterOutline,
  cycle: calendarOutline,
  combined: layersOutline,
} as const
