<template>
  <div v-if="loading" class="d-flex justify-center">
    <v-progress-circular />
  </div>
  <v-sheet class="rounded-md elevation-1 pb-4" v-else-if="reviewList?.length">
    <v-card-title>Комментарии</v-card-title>
    <Comment v-for="review in reviewList" :key="review.id" :review="review" />
  </v-sheet>
  <div v-else-if="Array.isArray(reviewList)">Комментарии не найдены</div>
</template>

<script setup lang="ts">
import type { Review } from "../../../entities/review"
import Comment from "./comment.vue"

interface Props {
  reviewList: Review[] | null
  loading: boolean
}

const { reviewList, loading } = defineProps<Props>()
</script>
