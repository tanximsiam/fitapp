<template>

  <div class="grid grid-cols-7 gap-2">
    <div
      v-for="(day, index) in week"
      :key="index"
      class="py-1 m-0 text-center text-xs rounded-2xl shadow-sm"
      :class="{
        'bg-rose-600 text-white': day.isToday,
        'bg-white text-slate-500': !day.isToday
      }"
    >
      <p class="py-1 text-center">{{ day.date }}</p>
      <p class="font-medium uppercase text-center">{{ day.day }}</p>
    </div>
  </div>

  
</template>

<script setup lang="ts">
import { ref } from 'vue';

function getCurrentWeek() {
  const today = new Date();
  const startOfWeek = new Date(today);
  const dayOfWeek = today.getDay(); // Sunday = 0
  startOfWeek.setDate(today.getDate() - dayOfWeek);

  const week = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);

    const isToday =
      date.toDateString() === new Date().toDateString();

    week.push({
      date: date.getDate().toString().padStart(2, '0'),
      day: date.toLocaleString('en-us', { weekday: 'narrow' }).toLowerCase(),
      isToday,
    });
  }

  return week;
}

const week = ref(getCurrentWeek());
</script>
