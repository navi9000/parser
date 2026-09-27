<template>
  <v-card v-if="company">
    <v-card-title>{{ company.name }}</v-card-title>
    <v-card-subtitle>{{ company.url }}</v-card-subtitle>
    <v-card-text>
      <p><strong>Отзывов: </strong>{{ company.review_count }}</p>
      <p><strong>Средняя оценка: </strong>{{ company.avg_rating }}</p>
    </v-card-text>
    <v-card-actions>
      <v-btn>Обновить данные</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { watch } from "vue"
import { useRoute } from "vuetify/lib/composables/router.mjs"
import type { Entity } from "../../../entities/entity"

interface Props {
  company: Entity | null
}

const { company } = defineProps<Props>()

const route = useRoute()

watch(
  () => route.value?.query.search,
  (value, oldValue) => {
    console.log({ value, oldValue })
  },
  { immediate: true },
)
</script>
