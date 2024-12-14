<template>
    <div class="container">
      <div class="content">
        <h1>User Login</h1>
        <v-text-field v-model="email" label="Email" name="email"> </v-text-field>
        <v-text-field
          v-model="password"
          :append-inner-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'"
          :rules="[]"
          :type="show1 ? 'text' : 'password'"
          hint="At least 8 characters"
          label="password"
          name="password"
          counter
          @click:append-inner="show1 = !show1"
        ></v-text-field>
        <v-btn :loading="loading" size="x-large" v-on:click="handleLogin">
          Login
        </v-btn>
      </div>
    </div>
  </template>
  
  <script>
  import { ref } from "vue";
  import { userDb } from "/src/databases";
  import { useUserStore } from "/src/stores/user-store.js";
  import { useNotifications } from "/src/stores/notifications.js";
  
  export default {
    setup() {
      const store = useUserStore();
  
      const email = ref("");
      const password = ref("");
      const loading = ref(false);
      const show1 = ref(false);
      const notification = useNotifications();
  
      
  
      async function handleLogin() {
        try {
          loading.value = true;
  
          await new Promise((res) => {
            setTimeout(() => res(), 1000);
          });
  
          const response = await userDb.login({
            email: email.value,
            password: password.value,
          });
  
          console.log(response);
  
          if (!response.user) throw response;
  
          const { user } = response;
  
          store.setValue("user", user);
          notification.create({
            status: "success",
            message: `Welcome, ${user.firstName ? user.firstName : user.email}!`,
          });
          loading.value = false;
        } catch (err) {
          loading.value = false;
          notification.create({
            status: "error",
            message: err,
          });
        }
      }
  
      return {
        handleLogin,
        email,
        password,
        loading,
        store,
        show1    
      };
    },
  };
  </script>
  
  <style scoped>
  .container {
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .content {
    width: 100%;
    max-width: 500px;
  }
  </style>
  
  