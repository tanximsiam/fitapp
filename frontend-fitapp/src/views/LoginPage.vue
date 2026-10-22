<template>
  <ion-page>
    <ion-content>
      <main class="mx-auto flex min-h-full w-full max-w-md flex-col px-6 py-6">
        <div class="flex justify-end"><ThemeToggle /></div>

        <!-- Centred like the mobile app: logo, greeting, form. -->
        <div class="flex flex-1 flex-col justify-center py-8">
          <div class="flex flex-col items-center text-center">
            <RouterLink to="/overview" aria-label="FitApp overview"><BrandLogo class="h-9" /></RouterLink>
            <h1 class="mt-8 text-[28px] leading-tight font-semibold tracking-tight">Welcome back</h1>
            <p class="mt-1.5 text-[15px] text-ink-2">Sign in to see your watch data and journal.</p>
          </div>

          <form class="mt-8 flex flex-col gap-4" novalidate @submit.prevent="handleLogin">
            <FormInput v-model="email" label="Email" type="email" inputmode="email" required autocomplete="email" placeholder="you@example.com" />
            <FormInput v-model="password" label="Password" type="password" required autocomplete="current-password" />
            <p v-if="auth.error" role="alert" class="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{{ auth.error }}</p>
            <PrimaryButton class="mt-2" :label="auth.isLoading ? 'Signing in…' : 'Sign in'" type="submit" :disabled="auth.isLoading || !email || !password" />
          </form>

          <p class="my-5 flex items-center gap-3 text-xs text-muted" aria-hidden="true"><span class="h-px flex-1 bg-line" />or<span class="h-px flex-1 bg-line" /></p>
          <GoogleButton @click="withGoogle" />
          <p v-if="googleNote" role="status" class="mt-2 text-center text-xs text-muted">{{ googleNote }}</p>

          <p v-if="providers.registration" class="mt-5 text-center text-sm text-ink-2">
            New to FitApp?
            <RouterLink :to="{ path: '/register', query: route.query }" class="font-medium text-accent">Create an account</RouterLink>
          </p>
        </div>

        <button type="button" class="mx-auto min-h-11 px-4 text-sm font-medium text-ink-2 hover:text-ink" @click="exploreSampleData(router)">
          Explore with sample data
        </button>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonContent, IonPage } from '@ionic/vue'
import BrandLogo from '@/components/BrandLogo.vue'
import FormInput from '@/components/FormInput.vue'
import GoogleButton from '@/components/GoogleButton.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { exploreSampleData, useSignIn } from '@/composables/useSignIn'
import { useModeStore } from '@/stores/mode'

const email = ref('')
const password = ref('')
const router = useRouter()
const route = useRoute()
const { auth, providers, done, google } = useSignIn()

const mode = useModeStore()
const googleNote = ref<string | null>(null)

// The browser-only build has no server to sign in to, so both ways in open the sample data.
async function handleLogin() {
  if (!mode.backendConfigured) return exploreSampleData(router)
  if (!(await auth.login(email.value.trim(), password.value))) return
  password.value = ''
  await done()
}

function withGoogle() {
  if (providers.value.google) return google()
  if (!mode.backendConfigured) return exploreSampleData(router)
  googleNote.value = 'Google sign-in is not set up on this server yet.'
}
</script>
