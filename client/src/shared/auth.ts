import { computed, ref } from "vue"
import { request, TOKEN_STORAGE_NAME } from "./api"

const token = ref<string | null>(localStorage.getItem(TOKEN_STORAGE_NAME))

export const isAuthenticated = computed(() => Boolean(token.value))

export async function login(loginValue: string, password: string) {
  const response = await request<{ access_token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ login: loginValue, password }),
  })
  token.value = response.access_token
  localStorage.setItem(TOKEN_STORAGE_NAME, response.access_token)
}

export function logout() {
  token.value = null
  localStorage.removeItem(TOKEN_STORAGE_NAME)
}

window.addEventListener("auth:unauthorized", logout)
