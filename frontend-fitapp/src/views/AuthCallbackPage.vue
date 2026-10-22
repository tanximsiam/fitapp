<template>
  <ion-page>
    <ion-content>
      <main class="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center px-6 text-center">
        <BrandLogo class="h-9" />
        <template v-if="error">
          <h1 class="mt-8 text-[22px] font-semibold tracking-tight">Couldn't sign in with Google</h1>
          <p role="alert" class="mt-2 text-[15px] text-ink-2">{{ error }}</p>
          <PrimaryButton class="mt-6" label="Back to sign in" @click="router.replace('/login')" />
        </template>
        <p v-else role="status" class="mt-8 text-[15px] text-ink-2">Signing you in…</p>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonContent, IonPage } from '@ionic/vue'
import BrandLogo from '@/components/BrandLogo.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import { useSignIn } from '@/composables/useSignIn'

/** Where the backend sends the person back after Google: ?code=<one-time code> or ?error=<message>. */
const route = useRoute()
const router = useRouter()
const { auth, done } = useSignIn()
const error = ref<string | null>(null)

onMounted(async () => {
  const { code, error: refused } = route.query
  if (typeof code !== 'string') {
    error.value = typeof refused === 'string' ? refused : 'Google sign-in did not finish. Try again.'
    return
  }
  if (await auth.loginWithGoogleCode(code)) await done()
  else error.value = auth.error
})
</script>
