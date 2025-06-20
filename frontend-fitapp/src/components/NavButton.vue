<!-- components/NavButton.vue -->
<template>
  <ion-button
    fill="clear"
    class="flex flex-col items-center text-white relative"
    :class="{ 'active-tab': isActive(path) }"
    @click="navigate(path)"
  >
    <div v-if="isActive(path)" class="indicator-bar"></div>
    <ion-icon :icon="icon" class="nav-icon" />
  </ion-button>
</template>

<script setup lang="ts">
import { IonButton, IonIcon } from "@ionic/vue";
import { useRouter, useRoute } from "vue-router";

defineProps<{
  path: string;
  icon: string;
}>();

const router = useRouter();
const route = useRoute();

const isActive = (targetPath: string) => route.path === targetPath;
const navigate = (targetPath: string) => {
  if (route.path !== targetPath) {
    router.replace(targetPath);
  }
};
</script>

<style scoped>
.nav-icon {
  --ionicon-stroke-width: 42px;
  font-size: 30px;
  color: #ffffff80;
  transition: 0.3s ease;
}

.active-tab .nav-icon {
  color: #ffffff;
}

.indicator-bar {
  height: 2px;
  width: 150%;
  background-color: white;
  position: absolute;
  bottom: -1px;
}
</style>
