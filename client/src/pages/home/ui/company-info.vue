<template>
  <div
    v-if="loading && !company"
    class="company-info d-flex justify-center align-center"
  >
    <v-progress-circular indeterminate />
  </div>
  <v-card class="company-info" v-else-if="company">
    <v-card-title>{{ company.name ?? company.slug }}</v-card-title>
    <v-card-subtitle>
      {{ company.slug }}
      <template v-if="'office_id' in company"> / {{ company.office_id }}</template>
    </v-card-subtitle>
    <v-card-text>
      <p><strong>Отзывов: </strong>{{ company.review_count }}</p>
      <p><strong>Средняя оценка: </strong>{{ company.avg_rating }}</p>
      <p v-if="'office_count' in company">
        <strong>Офисов: </strong>{{ company.office_count }}
      </p>
      <p v-else-if="company.last_updated_at">
        <strong>Обновлено: </strong>
        {{ new Date(company.last_updated_at).toLocaleString() }}
      </p>
      <p v-if="searching">Загрузка данных из Яндекса…</p>
      <p v-else-if="refreshing">Обновление данных…</p>
      <v-alert v-if="error" type="error" density="compact">{{ error }}</v-alert>
      <v-alert v-if="jobError" type="error" density="compact">
        {{ jobError }}
      </v-alert>
    </v-card-text>
    <v-card-actions>
      <v-select
        v-if="offices.length > 1"
        :model-value="selectedOfficeId"
        :items="offices"
        :item-title="officeLabel"
        item-value="id"
        label="Офис"
        density="compact"
        hide-details
        @update:model-value="$emit('select-office', $event)"
      />
      <v-btn
        v-if="offices.length > 1"
        @click="$emit('toggle-view')"
      >
        {{ scope === "office" ? "Показать компанию" : "Показать офис" }}
      </v-btn>
      <v-btn
        :disabled="!selectedOfficeId || searching"
        :loading="refreshing"
        @click="$emit('refresh')"
      >
        Обновить данные
      </v-btn>
    </v-card-actions>
  </v-card>
  <v-card class="company-info" v-else-if="error">
    <v-card-title>Не найдено</v-card-title>
    <v-card-text>{{ error }}</v-card-text>
  </v-card>
  <div class="company-info" v-else>
    <v-card-title>Введите наименование компании или URL</v-card-title>
  </div>
</template>

<script setup lang="ts">
import type { CompanySummary, Entity } from "../../../entities/entity"

interface Props {
  company: Entity | CompanySummary | null
  offices: Entity[]
  selectedOfficeId: number | null
  scope: "office" | "company"
  loading: boolean
  searching: boolean
  error: string | null
  jobError: string | null
  refreshing: boolean
}

defineProps<Props>()
defineEmits<{
  "select-office": [officeId: number]
  "toggle-view": []
  refresh: []
}>()

function officeLabel(office: Entity) {
  return `${office.name ?? office.slug} — ${office.office_id}`
}
</script>

<style>
.company-info {
  height: 230px;
}
</style>
