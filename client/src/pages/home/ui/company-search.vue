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
import { useRouter } from "vuetify/lib/composables/router.mjs"

const search = defineModel("search")
const router = useRouter()

const submit = () => {
  if (!router) {
    return
  }

  let value = search.value ?? ""
  if (value) {
    router.push(`/?search=${value}`)
  } else {
    router.push("/")
  }
}
</script>
