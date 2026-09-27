<template>
  <v-sheet class="rounded-md elevation-1 pb-4">
    <v-card-title>Комментарии</v-card-title>
    <Comment v-for="n in 3" :key="n" />
  </v-sheet>
</template>

<script setup lang="ts">
import Comment from "./comment.vue"
</script>
