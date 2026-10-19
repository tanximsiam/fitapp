<template>
  <ion-page>
    <ion-content>
      <main class="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center px-4 py-12">
        <BrandLogo class="mb-10 h-10 self-start" />
        <h1 class="text-2xl font-semibold tracking-tight">Sign in to your backend</h1>
        <p class="mt-2 break-all text-sm text-muted">{{ mode.backendUrl }}</p>

        <form class="mt-8 flex flex-col gap-4" novalidate @submit.prevent="handleLogin">
          <FormInput v-model="email" label="Email" type="email" inputmode="email" required autocomplete="email" />
          <FormInput v-model="password" label="Password" type="password" required autocomplete="current-password" />
          <p v-if="auth.error" role="alert" class="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">{{ auth.error }}</p>
          <PrimaryButton :label="auth.isLoading ? 'Signing in…' : 'Sign in'" type="submit" :disabled="auth.isLoading || !email || !password" />
        </form>

        <div class="mt-8 border-t border-line pt-6 text-sm text-ink-2">
          <p>No account yet? Accounts are created on the server with <code class="rounded bg-surface px-1 text-xs">php artisan fitapp:create-user</code>.</p>
          <button type="button" class="mt-4 font-medium text-accent underline underline-offset-2" @click="useDemo">Explore with sample data instead</button>
        </div>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import BrandLogo from '@/components/BrandLogo.vue'
import { IonContent, IonPage } from '@ionic/vue'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FormInput from '@/components/FormInput.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import { useAuthStore } from '@/stores/auth'
import { resetDataStores } from '@/stores/reset'
import { useModeStore } from '@/stores/mode'

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
  const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/overview'
  await router.replace(redirect)
}

function useDemo() {
  mode.setMode('demo')
  resetDataStores()
  router.replace('/overview')
}
</script>
