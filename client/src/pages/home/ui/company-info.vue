<template>
  <div
    v-if="loading && !company"
    class="company-info d-flex justify-center align-center"
  >
    <v-progress-circular indeterminate />
  </div>
  <v-card class="company-info" v-else-if="company">
    <div class="company-info__header">
      <v-card-title class="company-info__title">
        {{ company.name ?? company.slug }}
      </v-card-title>
      <v-card-subtitle class="company-info__subtitle">
        {{ company.slug }}
        <template v-if="'office_id' in company"> / {{ company.office_id }}</template>
      </v-card-subtitle>
    </div>
    <v-card-text class="company-info__details">
      <div class="company-info__stats">
        <p><strong>Отзывов: </strong>{{ company.review_count }}</p>
        <p><strong>Средняя оценка: </strong>{{ company.avg_rating }}</p>
        <p v-if="'office_count' in company">
          <strong>Офисов: </strong>{{ company.office_count }}
        </p>
        <p v-else-if="company.last_updated_at" class="company-info__updated">
          <strong>Обновлено: </strong>
          {{ new Date(company.last_updated_at).toLocaleString() }}
        </p>
      </div>
      <p v-if="searching" class="company-info__status">Загрузка данных из Яндекса…</p>
      <p v-else-if="refreshing" class="company-info__status">Обновление данных…</p>
      <v-alert v-if="error" class="company-info__alert" type="error" density="compact">
        {{ error }}
      </v-alert>
      <v-alert v-if="jobError" class="company-info__alert" type="error" density="compact">
        {{ jobError }}
      </v-alert>
    </v-card-text>
    <v-card-actions class="company-info__actions">
      <v-select
        v-if="offices.length > 1"
        class="company-info__office-select"
        :model-value="selectedOfficeId"
        :items="offices"
        :item-title="officeLabel"
        item-value="id"
        label="Офис"
        density="compact"
        hide-details
        @update:model-value="$emit('select-office', $event)"
      />
      <div class="company-info__buttons">
        <v-btn
          v-if="offices.length > 1"
          size="small"
          @click="$emit('toggle-view')"
        >
          {{ scope === "office" ? "Показать компанию" : "Показать офис" }}
        </v-btn>
        <v-btn
          size="small"
          :disabled="!selectedOfficeId || searching"
          :loading="refreshing"
          @click="$emit('refresh')"
        >
          Обновить данные
        </v-btn>
      </div>
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
  box-sizing: border-box;
  height: 230px;
}

.v-card.company-info {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.company-info__header {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 4px 16px 0;
}

.company-info__title.v-card-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  padding: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.company-info__subtitle.v-card-subtitle {
  max-width: 40%;
  overflow: hidden;
  padding: 0 0 0 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.company-info__details.v-card-text {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 16px;
}

.company-info__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px 12px;
}

.company-info__stats p,
.company-info__status {
  margin: 0;
}

.company-info__updated {
  grid-column: 1 / -1;
}

.company-info__status,
.company-info__alert {
  margin-top: 4px;
}

.company-info__actions.v-card-actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  padding: 4px 16px 8px;
}

.company-info__office-select {
  width: 100%;
}

.company-info__buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px;
}

.company-info__buttons .v-btn {
  min-width: 0;
  white-space: nowrap;
}
</style>
