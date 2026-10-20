<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button default-href="/welcome" text="" /></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <main class="mx-auto flex w-full max-w-md flex-col px-6 pt-4 pb-10">
        <BrandLogo class="mb-8 h-9 self-start" />
        <h1 class="text-[26px] leading-tight font-semibold tracking-tight">Sign in to your FitApp server</h1>
        <p class="mt-2 text-sm break-all text-muted">{{ mode.backendUrl }}</p>

        <form class="mt-8 flex flex-col gap-4" novalidate @submit.prevent="handleLogin">
          <FormInput v-model="email" label="Email" type="email" inputmode="email" required autocomplete="email" />
          <FormInput v-model="password" label="Password" type="password" required autocomplete="current-password" />
          <p v-if="auth.error" role="alert" class="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{{ auth.error }}</p>
          <PrimaryButton :label="auth.isLoading ? 'Signing in…' : 'Sign in'" type="submit" :disabled="auth.isLoading || !email || !password" />
        </form>

        <div class="mt-8 border-t border-line pt-6 text-sm text-ink-2">
          <p>Accounts are created on the server with <code class="rounded bg-surface px-1 text-xs">php artisan fitapp:create-user</code>.</p>
          <button type="button" class="mt-3 min-h-11 font-medium text-accent" @click="useDemo">Explore with sample data instead</button>
        </div>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonBackButton, IonButtons, IonContent, IonHeader, IonPage, IonToolbar } from '@ionic/vue'
import BrandLogo from '@/components/BrandLogo.vue'
import FormInput from '@/components/FormInput.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import { onboarding } from '@/lib/onboarding'
import { useAuthStore } from '@/stores/auth'
import { useModeStore } from '@/stores/mode'
import { resetDataStores } from '@/stores/reset'

const email = ref('')
const password = ref('')
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const mode = useModeStore()

async function handleLogin() {
  if (!(await auth.login(email.value.trim(), password.value))) return
  password.value = ''
  mode.setMode('backend')
  resetDataStores()
  onboarding.complete()
  const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/home'
  await router.replace(redirect)
}

function useDemo() {
  mode.setMode('demo')
  resetDataStores()
  // The welcome flow lets the person choose trackers before the demo starts.
  router.replace(onboarding.done() ? '/home' : '/welcome')
}
</script>
