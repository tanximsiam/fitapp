<template>
  <ion-page>
    <ion-content>
      <main class="mx-auto flex min-h-full w-full max-w-md flex-col px-6 py-6">
        <div class="flex justify-end"><ThemeToggle /></div>

        <div class="flex flex-1 flex-col justify-center py-8">
          <div class="flex flex-col items-center text-center">
            <RouterLink to="/overview" aria-label="FitApp overview"><BrandLogo class="h-9" /></RouterLink>
            <h1 class="mt-8 text-[28px] leading-tight font-semibold tracking-tight">Create your account</h1>
            <p class="mt-1.5 text-[15px] text-ink-2">Your watch data and journal, kept on your FitApp server.</p>
          </div>

          <form class="mt-8 flex flex-col gap-4" novalidate @submit.prevent="submit">
            <FormInput v-model="name" label="Name" required autocomplete="name" :error="!!auth.fieldErrors.name" :hint="auth.fieldErrors.name" />
            <FormInput v-model="email" label="Email" type="email" inputmode="email" required autocomplete="email" placeholder="you@example.com" :error="!!auth.fieldErrors.email" :hint="auth.fieldErrors.email" />
            <FormInput v-model="password" label="Password" type="password" required autocomplete="new-password" :hint="auth.fieldErrors.password ?? 'At least 8 characters'" :error="!!auth.fieldErrors.password" />
            <p v-if="auth.error && !hasFieldErrors" role="alert" class="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{{ auth.error }}</p>
            <PrimaryButton class="mt-2" :label="auth.isLoading ? 'Creating account…' : 'Create account'" type="submit" :disabled="auth.isLoading || !name || !email || password.length < 8" />
          </form>

          <template v-if="providers.google">
            <p class="my-5 flex items-center gap-3 text-xs text-muted" aria-hidden="true"><span class="h-px flex-1 bg-line" />or<span class="h-px flex-1 bg-line" /></p>
            <GoogleButton @click="google" />
          </template>
        </div>

        <p class="text-center text-sm text-ink-2">
          Already have an account?
          <RouterLink :to="{ path: '/login', query: route.query }" replace class="font-medium text-accent">Sign in</RouterLink>
        </p>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { IonContent, IonPage } from '@ionic/vue'
import BrandLogo from '@/components/BrandLogo.vue'
import FormInput from '@/components/FormInput.vue'
import GoogleButton from '@/components/GoogleButton.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useSignIn } from '@/composables/useSignIn'

const name = ref('')
const email = ref('')
const password = ref('')
const route = useRoute()
const { auth, providers, done, google } = useSignIn()
const hasFieldErrors = computed(() => Object.keys(auth.fieldErrors).length > 0)

async function submit() {
  const ok = await auth.register({ name: name.value.trim(), email: email.value.trim(), password: password.value, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
  if (!ok) return
  password.value = ''
  await done()
}
</script>
