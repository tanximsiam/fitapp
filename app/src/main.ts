import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { IonicVue } from '@ionic/vue'
import { App as NativeApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { TextZoom } from '@capacitor/text-zoom'
import App from './App.vue'
import router from './router'
import ripple from '@/directives/ripple'
import '@/composables/useTheme' // applies the saved theme

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/structure.css'

import './styles/tailwind.css'
import './styles/mobile.css'

/** The person's system text size (Android font scale, iOS Dynamic Type) applied to the whole app. */
function followSystemTextSize() {
  TextZoom.getPreferred()
    .then(({ value }) => TextZoom.set({ value }))
    .catch(() => {})
}
if (Capacitor.isNativePlatform()) {
  followSystemTextSize()
  NativeApp.addListener('resume', followSystemTextSize)
  // Back from Google sign-in in the system browser: fitapp://auth/google?code=… (see useSignIn).
  NativeApp.addListener('appUrlOpen', ({ url }) => {
    if (url.startsWith('fitapp://auth/google')) router.replace(`/auth/google${new URL(url).search}`)
  })
}

// Platform page transitions (iOS slide, Android fade-up), off when the system asks for reduced motion.
const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
const app = createApp(App).use(IonicVue, { animated: !reducedMotion }).use(createPinia()).use(router)
app.directive('ripple', ripple)

router.isReady().then(() => {
  app.mount('#app')
})
