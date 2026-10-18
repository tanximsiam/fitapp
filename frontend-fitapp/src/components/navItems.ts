import { footstepsOutline, gridOutline, moonOutline, pulseOutline, settingsOutline } from 'ionicons/icons'

export const NAV_ITEMS = [
  { to: '/overview', label: 'Overview', icon: gridOutline },
  { to: '/activity', label: 'Activity', icon: footstepsOutline },
  { to: '/sleep', label: 'Sleep', icon: moonOutline },
  { to: '/heart-rate', label: 'Heart rate', icon: pulseOutline },
  { to: '/settings', label: 'Settings', icon: settingsOutline },
] as const
