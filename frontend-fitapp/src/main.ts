import { createApp } from 'vue'
import { createPinia } from 'pinia';
import App from './App.vue'
import router from './router';
import { useAuthStore } from '@/stores/auth';
import ripple from '@/directives/ripple';


import { IonicVue } from '@ionic/vue';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
// import '@ionic/vue/css/normalize.css';
// import '@ionic/vue/css/structure.css';
// import '@ionic/vue/css/typography.css';

// /* Optional CSS utils that can be commented out */
// import '@ionic/vue/css/padding.css';
// import '@ionic/vue/css/float-elements.css';
// import '@ionic/vue/css/text-alignment.css';
// import '@ionic/vue/css/text-transformation.css';
// import '@ionic/vue/css/flex-utils.css';
// import '@ionic/vue/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* @import '@ionic/vue/css/palettes/dark.always.css'; */
/* @import '@ionic/vue/css/palettes/dark.class.css'; */
import '@ionic/vue/css/palettes/dark.system.css';

/* Theme variables */
import "./theme/variables.css";
import "./styles/tailwind.css";

if (import.meta.env.DEV) {
  import('./dev/dev-auth').then(({ devLogin, devLogout }) => {
    (window as any).devLogin = devLogin,
    (window as any).devLogout = devLogout
    console.log('%cDEV AUTH ENABLED: Use devLogin() and devLogout()', 'color: green')
  })
}
import axios from 'axios'

const token = localStorage.getItem('authToken')

if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  console.log('✅ Token restored:', token)
} else {
  console.warn('❌ No token found in localStorage')
}


const pinia = createPinia();
const app = createApp(App)
.use(IonicVue)
.use(router)
.use(pinia);
app.directive('ripple', ripple)

const auth = useAuthStore()
auth.init()
const savedToken = localStorage.getItem('authToken')
if (savedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
}
router.isReady().then(() => {
  app.mount('#app');
});
