import {
  ellipsisHorizontal,
  footstepsOutline,
  gridOutline,
  moonOutline,
  pulseOutline,
  settingsOutline,
  watchOutline,
} from 'ionicons/icons'

export interface NavItem {
  to: string
  label: string
  icon: string
}

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Watch',
    items: [
      { to: '/overview', label: 'Overview', icon: gridOutline },
      { to: '/activity', label: 'Activity', icon: footstepsOutline },
      { to: '/sleep', label: 'Sleep', icon: moonOutline },
      { to: '/heart-rate', label: 'Heart rate', icon: pulseOutline },
      { to: '/device', label: 'Watch & sync', icon: watchOutline },
    ],
  },
  {
    label: 'App',
    items: [{ to: '/settings', label: 'Settings', icon: settingsOutline }],
  },
]

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items)

/** Bottom bar on phones; everything else is under More. */
export const MOBILE_NAV: NavItem[] = [
  ALL_NAV_ITEMS[0],
  ALL_NAV_ITEMS[1],
  ALL_NAV_ITEMS[2],
  ALL_NAV_ITEMS[3],
  { to: '/more', label: 'More', icon: ellipsisHorizontal },
]
