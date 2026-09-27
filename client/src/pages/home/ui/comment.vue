<template>
  <v-card-text class="pb-0">
    <div class="d-flex ga-2 align-center">
      <div class="align-self-center">{{ review.author }}</div>
      <v-rating
        :length="5"
        :model-value="review.rating"
        size="sm"
        color="yellow"
        readonly
      />
    </div>
    <p>
      {{ review.text }}
    </p>
    <v-divider />
  </v-card-text>
</template>

<script setup lang="ts">
import type { Review } from "../../../entities/review"

interface Props {
  review: Review
}

const { review } = defineProps<Props>()
</script>
