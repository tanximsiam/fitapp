import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useModeStore } from '@/stores/mode'
import { onboarding } from '@/lib/onboarding'

import TabsLayout from '@/views/TabsLayout.vue'
import HomePage from '@/views/HomePage.vue'

// Only the shell and Home load at start-up; every other screen loads when first opened.
const HealthPage = () => import('@/views/HealthPage.vue')
const JournalPage = () => import('@/views/JournalPage.vue')
const InsightsPage = () => import('@/views/InsightsPage.vue')
const DevicePage = () => import('@/views/DevicePage.vue')
const WelcomePage = () => import('@/views/WelcomePage.vue')
const LoginPage = () => import('@/views/LoginPage.vue')
const RegisterPage = () => import('@/views/RegisterPage.vue')
const AuthCallbackPage = () => import('@/views/AuthCallbackPage.vue')
const OnboardingPage = () => import('@/views/OnboardingPage.vue')

/** Open before onboarding and without an account. */
const PUBLIC = ['/welcome', '/login', '/register', '/auth/google']

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
  { path: '/register', component: RegisterPage, meta: { title: 'Create account' } },
  { path: '/auth/google', component: AuthCallbackPage, meta: { title: 'Signing in' } },
  { path: '/onboarding', component: OnboardingPage, meta: { title: 'Set up' } },
  {
    path: '/',
    component: TabsLayout,
    children: [
      { path: '', redirect: '/home' },
      { path: 'home', component: HomePage, meta: { ...data, title: 'Today' } },
      { path: 'home/device', component: DevicePage, meta: { ...data, title: 'Watch & connection' } },
      { path: 'home/notifications', component: () => import('@/views/NotificationsPage.vue'), meta: { title: 'Notifications' } },
      { path: 'home/settings', component: () => import('@/views/SettingsPage.vue'), meta: { title: 'Profile & settings' } },
      { path: 'health', component: HealthPage, meta: { ...data, title: 'Health' } },
      { path: 'health/activity', component: () => import('@/views/ActivityPage.vue'), meta: { ...data, title: 'Activity' } },
      { path: 'health/workouts', component: () => import('@/views/WorkoutsPage.vue'), meta: { ...data, title: 'Workouts' } },
      { path: 'health/sleep', component: () => import('@/views/SleepPage.vue'), meta: { ...data, title: 'Sleep' } },
      { path: 'health/heart-rate', component: () => import('@/views/HeartRatePage.vue'), meta: { ...data, title: 'Heart rate' } },
      { path: 'health/stress', component: () => import('@/views/StressPage.vue'), meta: { ...data, title: 'Stress' } },
      { path: 'health/blood-oxygen', component: () => import('@/views/OxygenPage.vue'), meta: { ...data, title: 'Blood oxygen' } },
      { path: 'health/skin-temperature', component: () => import('@/views/SkinTemperaturePage.vue'), meta: { ...data, title: 'Skin temperature' } },
      { path: 'journal', component: JournalPage, meta: { ...data, title: 'Journal' } },
      { path: 'journal/mood', component: () => import('@/views/MoodPage.vue'), meta: { ...data, title: 'Mood' } },
      { path: 'journal/food', component: () => import('@/views/FoodPage.vue'), meta: { ...data, title: 'Food & drink' } },
      { path: 'journal/cycle', component: () => import('@/views/CyclePage.vue'), meta: { ...data, title: 'Periods' } },
      { path: 'insights', component: InsightsPage, meta: { ...data, title: 'Insights' } },
    ],
  },
  // Paths used by components shared with the web app.
  { path: '/overview', redirect: '/home' },
  { path: '/settings', redirect: '/home/settings' },
  { path: '/device', redirect: '/home/device' },
  ...['activity', 'sleep', 'heart-rate', 'stress', 'blood-oxygen', 'skin-temperature'].map((p) => ({ path: `/${p}`, redirect: `/health/${p}` })),
  ...['mood', 'food', 'cycle'].map((p) => ({ path: `/${p}`, redirect: `/journal/${p}` })),
  { path: '/timeline', redirect: '/journal' },
  { path: '/:pathMatch(.*)*', redirect: '/home' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  if (!onboarding.done() && !PUBLIC.includes(to.path) && to.path !== '/onboarding') return '/welcome'

  const mode = useModeStore()
  // Once set up, the welcome screen is behind you: back from Home stays in the app.
  if (to.path === '/welcome' && onboarding.done()) return '/home'
  if (mode.isDemo) {
    return PUBLIC.slice(1).includes(to.path) && !mode.backendConfigured ? '/home' : undefined
  }

  const auth = useAuthStore()
  await auth.init()
  if (to.meta.requiresData && !auth.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if ((to.path === '/login' || to.path === '/register') && auth.isAuthenticated) {
    return '/home'
  }
  // Setup belongs to an account (or to sample data, handled above).
  if (to.path === '/onboarding' && !auth.isAuthenticated) return '/welcome'
  // A new account answers the setup questions first; after that the screen is only reachable from the profile.
  if (auth.user && !auth.user.onboarded && to.path !== '/onboarding' && !PUBLIC.includes(to.path)) return '/onboarding'
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · FitApp` : 'FitApp'
})

export default router
