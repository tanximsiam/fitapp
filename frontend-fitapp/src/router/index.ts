import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useModeStore } from '@/stores/mode'

import OverviewPage from '@/views/OverviewPage.vue'
import ActivityPage from '@/views/ActivityPage.vue'
import SleepPage from '@/views/SleepPage.vue'
import HeartRatePage from '@/views/HeartRatePage.vue'
import SettingsPage from '@/views/SettingsPage.vue'
import DevicePage from '@/views/DevicePage.vue'
import MorePage from '@/views/MorePage.vue'
import TimelinePage from '@/views/TimelinePage.vue'
import StressPage from '@/views/StressPage.vue'
import OxygenPage from '@/views/OxygenPage.vue'
import SkinTemperaturePage from '@/views/SkinTemperaturePage.vue'
import MoodPage from '@/views/MoodPage.vue'
import FoodPage from '@/views/FoodPage.vue'
import CyclePage from '@/views/CyclePage.vue'
import LoginPage from '@/views/LoginPage.vue'

declare module 'vue-router' {
  interface RouteMeta {
    /** Needs a signed-in user when the backend is the data source. */
    requiresData?: boolean
    title?: string
  }
}

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/overview' },
  { path: '/home', redirect: '/overview' },
  { path: '/overview', name: 'Overview', component: OverviewPage, meta: { requiresData: true, title: 'Overview' } },
  { path: '/activity', name: 'Activity', component: ActivityPage, meta: { requiresData: true, title: 'Activity' } },
  { path: '/sleep', name: 'Sleep', component: SleepPage, meta: { requiresData: true, title: 'Sleep' } },
  { path: '/heart-rate', name: 'HeartRate', component: HeartRatePage, meta: { requiresData: true, title: 'Heart rate' } },
  { path: '/stress', name: 'Stress', component: StressPage, meta: { requiresData: true, title: 'Stress' } },
  { path: '/blood-oxygen', name: 'BloodOxygen', component: OxygenPage, meta: { requiresData: true, title: 'Blood oxygen' } },
  { path: '/skin-temperature', name: 'SkinTemperature', component: SkinTemperaturePage, meta: { requiresData: true, title: 'Skin temperature' } },
  { path: '/timeline', name: 'Timeline', component: TimelinePage, meta: { requiresData: true, title: 'Timeline' } },
  { path: '/mood', name: 'Mood', component: MoodPage, meta: { requiresData: true, title: 'Mood' } },
  { path: '/food', name: 'Food', component: FoodPage, meta: { requiresData: true, title: 'Food' } },
  { path: '/hydration', name: 'Hydration', component: () => import('@/views/HydrationPage.vue'), meta: { requiresData: true, title: 'Hydration' } },
  { path: '/cycle', name: 'Cycle', component: CyclePage, meta: { requiresData: true, title: 'Cycle' } },
  { path: '/device', name: 'Device', component: DevicePage, meta: { requiresData: true, title: 'Watch & sync' } },
  { path: '/settings', name: 'Settings', component: SettingsPage, meta: { title: 'Settings' } },
  { path: '/more', name: 'More', component: MorePage, meta: { title: 'All sections' } },
  { path: '/login', name: 'Login', component: LoginPage, meta: { title: 'Sign in' } },
  { path: '/:pathMatch(.*)*', redirect: '/overview' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  const mode = useModeStore()
  if (mode.isDemo) {
    return to.path === '/login' && !mode.backendConfigured ? '/overview' : undefined
  }

  const auth = useAuthStore()
  await auth.init()
  if (to.meta.requiresData && !auth.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.path === '/login' && auth.isAuthenticated) {
    return '/overview'
  }
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · FitApp` : 'FitApp'
})

export default router
