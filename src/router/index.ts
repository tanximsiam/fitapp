import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useModeStore } from '@/stores/mode'
import { onboarding } from '@/lib/onboarding'

import TabsLayout from '@/views/TabsLayout.vue'
import HomePage from '@/views/HomePage.vue'
import HealthPage from '@/views/HealthPage.vue'
import JournalPage from '@/views/JournalPage.vue'
import InsightsPage from '@/views/InsightsPage.vue'
import DevicePage from '@/views/DevicePage.vue'
import WelcomePage from '@/views/WelcomePage.vue'
import LoginPage from '@/views/LoginPage.vue'

declare module 'vue-router' {
  interface RouteMeta {
    /** Needs a signed-in user when the backend is the data source. */
    requiresData?: boolean
    title?: string
  }
}

const data = { requiresData: true }

const routes: Array<RouteRecordRaw> = [
  { path: '/welcome', component: WelcomePage, meta: { title: 'Welcome' } },
  { path: '/login', component: LoginPage, meta: { title: 'Sign in' } },
  {
    path: '/',
    component: TabsLayout,
    children: [
      { path: '', redirect: '/home' },
      { path: 'home', component: HomePage, meta: { ...data, title: 'Today' } },
      { path: 'home/settings', component: () => import('@/views/SettingsPage.vue'), meta: { title: 'Profile & settings' } },
      { path: 'health', component: HealthPage, meta: { ...data, title: 'Health' } },
      { path: 'health/activity', component: () => import('@/views/ActivityPage.vue'), meta: { ...data, title: 'Activity' } },
      { path: 'health/sleep', component: () => import('@/views/SleepPage.vue'), meta: { ...data, title: 'Sleep' } },
      { path: 'health/heart-rate', component: () => import('@/views/HeartRatePage.vue'), meta: { ...data, title: 'Heart rate' } },
      { path: 'health/stress', component: () => import('@/views/StressPage.vue'), meta: { ...data, title: 'Stress' } },
      { path: 'health/blood-oxygen', component: () => import('@/views/OxygenPage.vue'), meta: { ...data, title: 'Blood oxygen' } },
      { path: 'health/skin-temperature', component: () => import('@/views/SkinTemperaturePage.vue'), meta: { ...data, title: 'Skin temperature' } },
      { path: 'journal', component: JournalPage, meta: { ...data, title: 'Journal' } },
      { path: 'insights', component: InsightsPage, meta: { ...data, title: 'Insights' } },
      { path: 'device', component: DevicePage, meta: { ...data, title: 'Device' } },
    ],
  },
  // Paths used by components shared with the web app.
  { path: '/overview', redirect: '/home' },
  { path: '/settings', redirect: '/home/settings' },
  ...['activity', 'sleep', 'heart-rate', 'stress', 'blood-oxygen', 'skin-temperature'].map((p) => ({ path: `/${p}`, redirect: `/health/${p}` })),
  ...['timeline', 'mood', 'food', 'cycle'].map((p) => ({ path: `/${p}`, redirect: '/journal' })),
  { path: '/:pathMatch(.*)*', redirect: '/home' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  if (!onboarding.done() && to.path !== '/welcome' && to.path !== '/login') return '/welcome'

  const mode = useModeStore()
  if (mode.isDemo) {
    return to.path === '/login' && !mode.backendConfigured ? '/home' : undefined
  }

  const auth = useAuthStore()
  await auth.init()
  if (to.meta.requiresData && !auth.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.path === '/login' && auth.isAuthenticated) {
    return '/home'
  }
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · FitApp` : 'FitApp'
})

export default router
