<template>
  <ion-page>
    <ion-content>
      <main class="relative mx-auto flex min-h-full w-full max-w-md flex-col px-6 pt-[max(env(safe-area-inset-top),24px)] pb-[max(env(safe-area-inset-bottom),24px)]">
        <div class="flex items-center justify-between">
          <button type="button" class="-ml-2 grid size-11 place-items-center rounded-full text-ink" aria-label="Back" @click="back">
            <ion-icon :icon="arrowBack" aria-hidden="true" class="text-[22px]" />
          </button>
          <ThemeToggle />
        </div>

        <!-- Centred like the welcome screen: logo, greeting, form. -->
        <div class="flex flex-1 flex-col justify-center pb-6">
          <div class="flex flex-col items-center text-center">
            <BrandLogo class="h-9" />
            <h1 class="mt-8 text-[28px] leading-tight font-semibold tracking-tight">Welcome back</h1>
            <p class="mt-1.5 text-[15px] text-ink-2">Sign in to see your watch data and journal.</p>
          </div>

          <form class="mt-8 flex flex-col gap-4" novalidate @submit.prevent="handleLogin">
            <FormInput v-model="email" label="Email" type="email" inputmode="email" required autocomplete="email" placeholder="you@example.com" />
            <FormInput v-model="password" label="Password" type="password" required autocomplete="current-password" />
            <p v-if="auth.error" role="alert" class="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{{ auth.error }}</p>
            <PrimaryButton class="mt-2" :label="auth.isLoading ? 'Signing in…' : 'Sign in'" type="submit" :disabled="auth.isLoading || !email || !password" />
          </form>

          <template v-if="providers.google">
            <p class="my-5 flex items-center gap-3 text-xs text-muted" aria-hidden="true"><span class="h-px flex-1 bg-line" />or<span class="h-px flex-1 bg-line" /></p>
            <GoogleButton @click="google" />
          </template>

          <p v-if="providers.registration" class="mt-5 text-center text-sm text-ink-2">
            New to FitApp?
            <RouterLink :to="{ path: '/register', query: route.query }" class="inline-flex min-h-11 items-center font-medium text-accent">Create an account</RouterLink>
          </p>
        </div>

        <button type="button" class="mx-auto min-h-11 px-4 text-sm font-medium text-ink-2" @click="useDemo">
          Explore with sample data instead
        </button>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonContent, IonIcon, IonPage, useIonRouter } from '@ionic/vue'
import { arrowBack } from 'ionicons/icons'
import BrandLogo from '@/components/BrandLogo.vue'
import FormInput from '@/components/FormInput.vue'
import GoogleButton from '@/components/GoogleButton.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { exploreSampleData, useSignIn } from '@/composables/useSignIn'
import { onboarding } from '@/lib/onboarding'

const email = ref('')
const password = ref('')
const router = useRouter()
const ionRouter = useIonRouter()
const route = useRoute()
const { auth, providers, done, google } = useSignIn()

async function handleLogin() {
  if (!(await auth.login(email.value.trim(), password.value))) return
  password.value = ''
  await done()
}

const useDemo = () => exploreSampleData(router)

/** Back to wherever sign-in was opened from; the welcome screen when opened directly. */
function back() {
  if (ionRouter.canGoBack()) ionRouter.back()
  else router.replace(onboarding.done() ? '/home' : '/welcome')
}
</script>
