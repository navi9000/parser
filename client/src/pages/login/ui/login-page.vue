<template>
  <div class="d-flex justify-center align-center pa-2 container">
    <v-sheet width="300">
      <v-form class="pa-2" @submit="onSubmit" autocomplete="off">
        <v-text-field v-model="login" label="Логин" single-line></v-text-field>
        <v-text-field
          v-model="password"
          label="Пароль"
          single-line
        ></v-text-field>
        <v-btn type="submit" block>Войти</v-btn>
      </v-form>
    </v-sheet>
  </div>
</template>

<style>
.container {
  height: 100vh;
}
</style>

<script setup lang="ts">
import { useRouter } from "vue-router"
import type { SubmitEventPromise } from "vuetify"

const router = useRouter()

const login = defineModel("login")
const password = defineModel("password")

const onSubmit = (e: SubmitEventPromise) => {
  e.preventDefault()
  router.push("/")
}
</script>
