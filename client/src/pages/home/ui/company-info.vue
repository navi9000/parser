<template>
  <div v-if="loading" class="company-info d-flex justify-center align-center">
    <v-progress-circular></v-progress-circular>
  </div>
  <v-card class="company-info" v-else-if="company">
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
  <div class="company-info" v-else-if="error">
    <v-card-title>Не найдено</v-card-title>
  </div>
  <div class="company-info" v-else>
    <v-card-title>Введите наименование компании или url</v-card-title>
  </div>
</template>

<script setup lang="ts">
import type { Entity } from "../../../entities/entity"

interface Props {
  company: Entity | null
  error: boolean
  loading: boolean
}

const { company, error, loading } = defineProps<Props>()
</script>

<style>
.company-info {
  height: 230px;
}
</style>
