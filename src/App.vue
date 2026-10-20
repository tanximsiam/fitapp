<template>
  <ion-app>
    <ion-router-outlet />
    <!-- The quick-log sheet and its forms (with the food list) load the first time it opens. -->
    <QuickLog v-if="quickLogUsed" />
  </ion-app>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref, watch } from 'vue'
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { useUiStore } from '@/stores/ui'

const QuickLog = defineAsyncComponent(() => import('@/components/QuickLog.vue'))
const ui = useUiStore()
const quickLogUsed = ref(false)
watch(
  () => ui.quickLog,
  (v) => v && (quickLogUsed.value = true),
)
</script>
