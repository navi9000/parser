<template>
  <v-text-field
    v-model="search"
    label="Введите url"
    prepend-inner-icon="mdi-magnify"
    variant="outlined"
    hide-details
    single-line
  ></v-text-field>
</template>

<script setup lang="ts">
const search = defineModel("search")
</script>
