import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { IonicVue } from '@ionic/vue'
import App from './App.vue'
import router from './router'
import ripple from '@/directives/ripple'

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css'

import './styles/tailwind.css'

// Section switches are navigation between peers, not a stack: no slide transitions.
const app = createApp(App).use(IonicVue, { animated: false }).use(createPinia()).use(router)
app.directive('ripple', ripple)

router.isReady().then(() => {
  app.mount('#app')
})
