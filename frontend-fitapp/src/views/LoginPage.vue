<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Login</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="bg-white">
      <main class="h-full p-4 flex flex-col gap-4 bg-slate-50">

        <div class="h-64 w-full flex items-center justify-center">
          <!-- <img
            src="@/assets/logo.png"
            alt="Logo"
            class="h-16 w-16 rounded-full shadow-md"
          /> -->
        </div>
        <form @submit.prevent="handleLogin" class="w-full flex flex-col gap-4">
          <div class="flex flex-col gap-4">
            <p class="text-md  text-slate-400 text-center">Enter your credentials to login.</p>
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
            <a
              href=""
              class="text-slate-400 text-xs text-right underline"
            >Forgot Password?</a>
            <!-- <div class="flex items-center justify-between">
            
            </div> -->
          </div>

          <PrimaryButton
            label="Login"
            type="submit"
          />
  
          <!-- <ion-button expand="block" type="submit">
            Login
          </ion-button> -->
        </form>
        <a
              href=""
              class="text-slate-400 text-xs text-center"
            >New here? <span class="text-red-400 underline">Sign up.</span></a>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, } from "@ionic/vue";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import FormInput from "@/components/FormInput.vue"; 
import PrimaryButton from "@/components/PrimaryButton.vue"; 


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
