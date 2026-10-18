<template>
  <ion-page>
    <ion-content>
      <main class="min-h-full p-4 flex flex-col justify-center gap-4 bg-slate-50 max-w-sm mx-auto">
        <form class="w-full flex flex-col gap-4" novalidate @submit.prevent="handleLogin">
          <p class="text-slate-500 text-center">Enter your credentials to sign in.</p>
          <FormInput v-model="email" label="Email" type="email" required autocomplete="email" />
          <FormInput v-model="password" label="Password" type="password" required autocomplete="current-password" />
          <p v-if="auth.error" role="alert" class="text-sm text-red-700">{{ auth.error }}</p>
          <PrimaryButton
            :label="auth.isLoading ? 'Signing in…' : 'Sign in'"
            type="submit"
            :disabled="auth.isLoading || !email || !password"
          />
        </form>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import FormInput from '@/components/FormInput.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'

const email = ref('')
const password = ref('')
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

async function handleLogin() {
  if (await auth.login(email.value.trim(), password.value)) {
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/home'
    await router.replace(redirect.startsWith('/') ? redirect : '/home')
  }
}
</script>
