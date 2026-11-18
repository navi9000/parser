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
    @click:clear="clearSearch"
  ></v-text-field>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"

const search = ref<string | null>("")
const route = useRoute()
const router = useRouter()

watch(
  () => route.query.search,
  (value) => {
    search.value = typeof value === "string" ? value : ""
  },
  { immediate: true },
)

function submit() {
  const value = (search.value ?? "").trim()
  if (value) {
    void router.push({ path: "/", query: { search: value } })
  } else {
    clearSearch()
  }
}

function clearSearch() {
  search.value = ""
  void router.replace({ path: "/", query: {} })
}
</script>
