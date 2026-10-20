import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { IonicVue } from '@ionic/vue'
import App from './App.vue'
import router from './router'
import ripple from '@/directives/ripple'
import '@/composables/useTheme' // applies the saved theme

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/structure.css'

import './styles/tailwind.css'
import './styles/mobile.css'

// Platform transitions (iOS slide, Android fade-up) for pushed detail pages; tabs switch without animation.
const app = createApp(App).use(IonicVue).use(createPinia()).use(router)
app.directive('ripple', ripple)

router.isReady().then(() => {
  app.mount('#app')
})
