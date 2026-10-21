import { ellipsisHorizontal, gridOutline, listOutline, settingsOutline, watchOutline } from 'ionicons/icons'
import { ICONS } from '@/components/metricIcons'
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
      { to: '/activity', label: 'Activity', icon: ICONS.activity },
      { to: '/sleep', label: 'Sleep', icon: ICONS.sleep },
      { to: '/heart-rate', label: 'Heart rate', icon: ICONS.heartRate },
      { to: '/stress', label: 'Stress', icon: ICONS.stress },
      { to: '/blood-oxygen', label: 'Blood oxygen', icon: ICONS.spo2 },
      { to: '/skin-temperature', label: 'Skin temperature', icon: ICONS.skinTemp },
      { to: '/device', label: 'Watch & sync', icon: watchOutline },
    ],
  },
  {
    label: 'Journal',
    items: [
      { to: '/timeline', label: 'Timeline', icon: listOutline },
      { to: '/mood', label: 'Mood', icon: ICONS.mood, tracker: 'mood' },
      { to: '/food', label: 'Food', icon: ICONS.meals, tracker: 'food' },
      { to: '/hydration', label: 'Hydration', icon: ICONS.water, tracker: 'hydration' },
      { to: '/cycle', label: 'Cycle', icon: ICONS.cycle, tracker: 'cycle' },
    ],
  },
  {
    label: 'App',
    items: [{ to: '/settings', label: 'Settings', icon: settingsOutline }],
  },
]

export const visibleGroups = (prefs: TrackerPrefs) =>
  NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => !i.tracker || prefs[i.tracker]) }))

/** Bottom bar on phones; everything else is under More. */
export const MOBILE_NAV: NavItem[] = [
  { to: '/overview', label: 'Overview', icon: gridOutline },
  { to: '/activity', label: 'Activity', icon: ICONS.activity },
  { to: '/sleep', label: 'Sleep', icon: ICONS.sleep },
  { to: '/timeline', label: 'Timeline', icon: listOutline },
  { to: '/more', label: 'More', icon: ellipsisHorizontal },
]
