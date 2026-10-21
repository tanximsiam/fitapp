import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import * as authApi from '@/api/auth'
import { onboarding } from '@/lib/onboarding'
import { useAuthStore } from '@/stores/auth'
import { useModeStore } from '@/stores/mode'
import { resetDataStores } from '@/stores/reset'

/** Custom URL scheme the backend returns to after Google sign-in (AndroidManifest.xml, Info.plist). */
export const APP_AUTH_RETURN = 'fitapp://auth/google'

/** Shared by the sign-in, sign-up and Google return screens. */
export function useSignIn() {
  const router = useRouter()
  const route = useRoute()
  const auth = useAuthStore()
  const mode = useModeStore()
  // Hidden until the server says which options it offers.
  const providers = ref<authApi.AuthProviders>({ registration: false, google: false })

  onMounted(async () => {
    // A message from the other sign-in screen does not belong here.
    auth.error = null
    auth.fieldErrors = {}
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
    onboarding.complete()
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/home'
    await router.replace(redirect)
  }

  /** Google's page opens in the system browser on a phone (Google refuses embedded web views) and in this tab on the web. */
  function google() {
    const back = Capacitor.isNativePlatform() ? APP_AUTH_RETURN : `${location.origin}${import.meta.env.BASE_URL}auth/google`
    window.location.href = authApi.googleSignInUrl(back)
  }

  return { auth, providers, done, google }
}
