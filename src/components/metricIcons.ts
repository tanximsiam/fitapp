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
  pulseOutline,
  restaurantOutline,
  speedometerOutline,
  thermometerOutline,
  timerOutline,
  walkOutline,
  waterOutline,
} from 'ionicons/icons'

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
  spo2: pulseOutline,
  skinTemp: thermometerOutline,
  mood: happyOutline,
  energy: batteryHalfOutline,
  meals: restaurantOutline,
  water: waterOutline,
  cycle: calendarOutline,
  combined: layersOutline,
} as const
