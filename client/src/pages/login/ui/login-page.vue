<template>
  <div class="d-flex justify-center align-center pa-2 container">
    <v-sheet width="300">
      <v-form
        class="pa-2 d-flex flex-column ga-2"
        autocomplete="off"
        @submit="onSubmit"
      >
        <v-text-field v-model="login" label="Login" single-line hide-details />
        <v-text-field
          v-model="password"
          label="Password"
          type="password"
          single-line
          hide-details
        />
        <v-alert v-if="error" type="error">{{ error }}</v-alert>
        <v-btn type="submit" block :loading="loading">Sign in</v-btn>
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
import { ref } from "vue"
import { useRouter } from "vue-router"
import type { SubmitEventPromise } from "vuetify"
import { login as authenticate } from "../../../shared/auth"

const router = useRouter()
const login = defineModel<string>("login")
const password = defineModel<string>("password")

const loading = ref(false)
const error = ref("")

const onSubmit = async (event: SubmitEventPromise) => {
  event.preventDefault()
  error.value = ""
  loading.value = true
  try {
    await authenticate(login.value ?? "", password.value ?? "")
    await router.push("/")
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "Unable to sign in"
  } finally {
    loading.value = false
  }
}
</script>
