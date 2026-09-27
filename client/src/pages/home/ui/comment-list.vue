<template>
  <v-sheet class="rounded-md elevation-1 pb-4" v-if="reviewList.length">
    <v-card-title>Комментарии</v-card-title>
    <Comment v-for="review in reviewList" :key="review.id" :review="review" />
  </v-sheet>
</template>

<script setup lang="ts">
import type { Review } from "../../../entities/review"
import Comment from "./comment.vue"

interface Props {
  reviewList: Review[]
}

const { reviewList } = defineProps<Props>()
</script>
