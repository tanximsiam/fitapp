import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useModeStore } from '@/stores/mode'

import OverviewPage from '@/views/OverviewPage.vue'
import ActivityPage from '@/views/ActivityPage.vue'
import SleepPage from '@/views/SleepPage.vue'
import HeartRatePage from '@/views/HeartRatePage.vue'
import SettingsPage from '@/views/SettingsPage.vue'
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
  { path: '/settings', name: 'Settings', component: SettingsPage, meta: { title: 'Settings' } },
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
