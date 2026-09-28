<template>
  <div v-if="loading" class="comment-list d-flex flex-grow-1 min-h-0 justify-center align-center overflow-hidden">
    <v-progress-circular />
  </div>
  <v-sheet class="comment-list d-flex flex-column flex-grow-1 min-h-0 rounded-md elevation-1 overflow-hidden" v-else-if="reviewList?.length">
    <v-card-title>Комментарии</v-card-title>
    <div class="comment-list__content">
      <Comment v-for="review in reviewList" :key="review.id" :review="review" />
    </div>
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

<style scoped>
.comment-list {
  min-height: 0;
  flex-grow: 1;
}

.comment-list__content {
  height: calc(100% - 52px);
  overflow-y: auto;
  padding-bottom: 16px;
}
</style>
