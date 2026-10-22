import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { IonicVue } from '@ionic/vue'
import App from './App.vue'
import router from './router'
import ripple from '@/directives/ripple'
import { api, isUnauthorized, tokenStorage } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useModeStore } from '@/stores/mode'
import { resetDataStores } from '@/stores/reset'
import '@/composables/useTheme' // applies the saved theme

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css'

import './styles/tailwind.css'

// Section switches are navigation between peers, not a stack: no slide transitions.
const app = createApp(App).use(IonicVue, { animated: false }).use(createPinia()).use(router)
app.directive('ripple', ripple)

// A session the server no longer accepts (signed out elsewhere, account removed) ends here: back to sign-in, then to this page.
api.interceptors.response.use(undefined, (err) => {
  const auth = useAuthStore()
  if (isUnauthorized(err) && auth.user && !useModeStore().isDemo) {
    tokenStorage.clear()
    auth.user = null
    resetDataStores()
    router.replace({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
  }
  return Promise.reject(err)
})

router.isReady().then(() => {
  app.mount('#app')
})
