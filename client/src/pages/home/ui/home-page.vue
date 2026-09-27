<template>
  <div class="pa-2 d-flex ga-2 flex-column">
    <company-search />
    <company-info :company="company" />
    <comment-list :review-list="reviewList" />
  </div>
</template>

<script setup lang="ts">
import CompanySearch from "./company-search.vue"
import CompanyInfo from "./company-info.vue"
import commentList from "./comment-list.vue"
import type { Review } from "../../../entities/review/model.ts"

const company = {
  id: 1,
  name: "test",
  url: "test url",
  review_count: 23,
  avg_rating: "4.3",
}

const reviewList: Review[] = [
  {
    id: 1,
    entity_id: 3,
    author: "John Doe",
    rating: 2,
    text: "Hello",
  },
  {
    id: 2,
    entity_id: 3,
    author: "John Doe",
    rating: 2,
    text: "Hello",
  },
  {
    id: 3,
    entity_id: 3,
    author: "John Doe",
    rating: 2,
    text: "Hello",
  },
]

// const company = null
</script>
