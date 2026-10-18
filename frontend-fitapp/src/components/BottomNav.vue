<!-- components/BottomNav.vue -->
<template>
  <div
    class="fixed bottom-0 left-0 right-0 z-50 h-[64px] bg-rose-700 flex justify-around"
  >
    <NavButton path="/home" :icon="homeOutline" />
    <NavButton path="/dashboard" :icon="gridOutline" />
    <NavButton path="/resources" :icon="bookOutline" />
    <NavButton path="/inbox" :icon="mailOutline" />
  </div>
</template>

<script setup lang="ts">
import NavButton from "@/components/NavButton.vue";
import {
  homeOutline,
  gridOutline,
  bookOutline,
  mailOutline,
} from "ionicons/icons";
</script>