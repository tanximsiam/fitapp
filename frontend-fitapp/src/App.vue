<template>
  <ion-app>
    <ion-router-outlet />
    <QuickLog />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import QuickLog from '@/components/QuickLog.vue'
</script>
