<template>
  <ion-page>
    <ion-content>
      <main class="relative mx-auto flex min-h-full w-full max-w-md flex-col px-6 pt-[max(env(safe-area-inset-top),24px)] pb-[max(env(safe-area-inset-bottom),24px)]">
        <!-- Light, dark or the system's setting, before signing in; the choice carries into the app. Pinned to the corner so the logo stays centred. -->
        <ThemeToggle class="absolute top-[max(env(safe-area-inset-top),24px)] right-6 z-10" />

        <!-- One screen, no scrolling: logo, promise and sources centred in the space above the ways in. -->
        <section class="flex flex-1 flex-col" aria-labelledby="intro-title">
          <div class="flex flex-1 flex-col items-center justify-center pt-10 text-center">
            <BrandLogo class="h-9" />
            <h1 id="intro-title" class="mt-8 text-[28px] leading-tight font-semibold tracking-tight">Your watch, and what it can't measure.</h1>
            <p class="mt-2 text-[15px] leading-relaxed text-ink-2">Watch data, mood, meals, water and periods in one place, with every pattern explained.</p>

            <ol class="card mt-6 w-full divide-y divide-line text-left" aria-label="Where your data comes from">
              <li v-for="s in SOURCES" :key="s.title" class="flex items-center gap-3 px-4 py-3">
                <span class="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent" aria-hidden="true">
                  <ion-icon :icon="s.icon" class="text-base" />
                </span>
                <span class="min-w-0">
                  <span class="block text-sm font-semibold">{{ s.title }}</span>
                  <span class="block text-[13px] leading-snug text-ink-2">{{ s.text }}</span>
                </span>
              </li>
            </ol>
          </div>

          <div class="grid gap-3 pt-6">
            <template v-if="mode.backendConfigured">
              <PrimaryButton label="Sign in" @click="go('/login')" />
              <PrimaryButton variant="secondary" label="Create account" @click="go('/register')" />
              <button type="button" class="min-h-11 text-sm font-medium text-ink-2" @click="explore">Explore with sample data</button>
            </template>
            <PrimaryButton v-else label="Explore with sample data" @click="explore" />
          </div>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { IonContent, IonIcon, IonPage } from '@ionic/vue'
import { layersOutline, phonePortraitOutline, watchOutline } from 'ionicons/icons'
import BrandLogo from '@/components/BrandLogo.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { onboarding } from '@/lib/onboarding'
import { useModeStore } from '@/stores/mode'
import { resetDataStores } from '@/stores/reset'

const SOURCES = [
  { icon: watchOutline, title: 'Your watch', text: 'Activity, sleep and heart rate' },
  { icon: phonePortraitOutline, title: 'Health Connect or Apple Health', text: 'For watches that share through their own app' },
  { icon: layersOutline, title: 'What you add', text: 'Mood, meals, water and periods' },
]

const router = useRouter()
const mode = useModeStore()

function go(path: string) {
  mode.setMode('backend')
  resetDataStores()
  router.push(path)
}

/** Straight into the app with sample data and default trackers; setup questions are for real accounts. */
function explore() {
  mode.setMode('demo')
  resetDataStores()
  onboarding.complete()
  router.replace('/home')
}
</script>
