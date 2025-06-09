<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Login</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="bg-white">
      <main class="h-full p-4 flex gap-4 bg-slate-50">
        <form @submit.prevent="handleLogin" class="w-full flex flex-col gap-4">
          <FormInput
            label="Email"
            type="email"
            placeholder="Enter your Email"
            v-model="email"
            required
            autocomplete="email"
          />
          <FormInput
            label="Password"
            type="password"
            placeholder="Enter your password"
            v-model="password"
            required
          />
  
          <ion-button expand="block" type="submit">
            Login
          </ion-button>
        </form>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, } from "@ionic/vue";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import FormInput from "@/components/FormInput.vue"; // Adjust path if needed


// Reactive form inputs
// const username = ref('');
const password = ref('');
const email = ref('')

// Router and auth store
const router = useRouter();
const authStore = useAuthStore();

// Handle login
const handleLogin = async () => {
  authStore.error = null;

  try {
    await authStore.login({
      email: email.value.trim(),
      password: password.value,
    });

    if (authStore.isAuthenticated) {
      await router.push("/home");
    }
  } catch (err) {
    console.error("Login failed:", authStore.error);
  }
};
</script>

<style scoped>
* {
  font-family: Poppins;
}

#container {
  max-width: 400px;
  margin: auto;
  padding-top: 2rem;
}
.text-red-500 {
  color: #ef4444;
}
</style>
