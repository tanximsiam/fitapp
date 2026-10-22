import { onMounted, ref } from 'vue'
import { useRoute, useRouter, type Router } from 'vue-router'
import * as authApi from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { useModeStore } from '@/stores/mode'
import { resetDataStores } from '@/stores/reset'

/** Sample data instead of an account: the browser-only data, then where the visitor was heading. */
export function exploreSampleData(router: Router) {
  useModeStore().setMode('demo')
  resetDataStores()
  const redirect = router.currentRoute.value.query.redirect
  router.replace(typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/overview')
}

/** Shared by the sign-in, sign-up and Google return pages (as in the mobile app). */
export function useSignIn() {
  const router = useRouter()
  const route = useRoute()
  const auth = useAuthStore()
  const mode = useModeStore()
  // Hidden until the server says which options it offers.
  const providers = ref<authApi.AuthProviders>({ registration: false, google: false })

  onMounted(async () => {
    // A message from the other sign-in page does not belong here.
    auth.error = null
    auth.fieldErrors = {}
    if (!mode.backendConfigured) return
    try {
      providers.value = await authApi.providers()
    } catch {
      // Unreachable server: password sign-in still shows and reports the connection error.
    }
  })

  /** After any successful sign-in: switch to the server's data and go where the person was heading. */
  async function done() {
    mode.setMode('backend')
    resetDataStores()
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/overview'
    await router.replace(redirect)
  }

  /** Google's page opens in this tab and returns to /auth/google. */
  function google() {
    window.location.href = authApi.googleSignInUrl(`${location.origin}${import.meta.env.BASE_URL}auth/google`)
  }

  return { auth, providers, done, google }
}
