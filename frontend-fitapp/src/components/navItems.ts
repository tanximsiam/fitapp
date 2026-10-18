import {
  addCircleOutline,
  calendarOutline,
  ellipsisHorizontal,
  flashOutline,
  thermometerOutline,
  waterOutline,
  footstepsOutline,
  gridOutline,
  happyOutline,
  listOutline,
  moonOutline,
  pulseOutline,
  restaurantOutline,
  settingsOutline,
  watchOutline,
} from 'ionicons/icons'
import type { TrackerPrefs } from '@/types/journal'

export interface NavItem {
  to: string
  label: string
  icon: string
  /** Hidden when this complementary tracker is turned off. */
  tracker?: keyof TrackerPrefs
}

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Watch',
    items: [
      { to: '/overview', label: 'Overview', icon: gridOutline },
      { to: '/activity', label: 'Activity', icon: footstepsOutline },
      { to: '/sleep', label: 'Sleep', icon: moonOutline },
      { to: '/heart-rate', label: 'Heart rate', icon: pulseOutline },
      { to: '/stress', label: 'Stress', icon: flashOutline },
      { to: '/blood-oxygen', label: 'Blood oxygen', icon: waterOutline },
      { to: '/skin-temperature', label: 'Skin temperature', icon: thermometerOutline },
      { to: '/device', label: 'Watch & sync', icon: watchOutline },
    ],
  },
  {
    label: 'Journal',
    items: [
      { to: '/timeline', label: 'Timeline', icon: listOutline },
      { to: '/mood', label: 'Mood', icon: happyOutline, tracker: 'mood' },
      { to: '/food', label: 'Food & drink', icon: restaurantOutline, tracker: 'food' },
      { to: '/cycle', label: 'Cycle', icon: calendarOutline, tracker: 'cycle' },
    ],
  },
  {
    label: 'App',
    items: [{ to: '/settings', label: 'Settings', icon: settingsOutline }],
  },
]

export const visibleGroups = (prefs: TrackerPrefs) =>
  NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => !i.tracker || prefs[i.tracker]) }))

/** Bottom bar on phones. `to: null` is the Quick log action; everything else is under More. */
export const MOBILE_NAV: (NavItem | { to: null; label: string; icon: string })[] = [
  { to: '/overview', label: 'Overview', icon: gridOutline },
  { to: '/activity', label: 'Activity', icon: footstepsOutline },
  { to: null, label: 'Log', icon: addCircleOutline },
  { to: '/timeline', label: 'Timeline', icon: listOutline },
  { to: '/more', label: 'More', icon: ellipsisHorizontal },
]
