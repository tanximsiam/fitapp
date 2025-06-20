<template aria-label="Home Page">
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Blank</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Blank</ion-title>
        </ion-toolbar>
      </ion-header>
      <main class="h-full p-4 flex flex-col gap-4 bg-slate-50">
        <div class="flex flex-col gap-3">
          <p class="text-sm font-semibold text-slate-600">
            Good morning, User!<br />
            <span class="text-xs font-light">Check what you have for today.</span>
          </p>
          <CalendarComp />
        </div>
      </main>

      <BottomNav />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
// import Button from "primevue/button"
import BottomNav from '@/components/BottomNav.vue';
import CalendarComp from '@/components/CalendarComp.vue';
</script>

<style scoped>
* {
  font-family: Poppins;
}
</style>
