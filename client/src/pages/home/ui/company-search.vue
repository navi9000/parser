<template>
  <v-text-field
    v-model="search"
    label="Введите наименование компании или url"
    prepend-inner-icon="mdi-magnify"
    variant="outlined"
    hide-details
    single-line
    clearable
    autocomplete="off"
    @keyup.enter="submit"
    @click.clear="submit"
  ></v-text-field>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"

const search = ref<string | null>("")
const router = useRouter()

function submit() {
  const value = (search.value ?? "").trim()
  if (value) {
    void router.push({ path: "/", query: { search: value } })
  } else {
    void router.push({ path: "/", query: {} })
  }
}
</script>
