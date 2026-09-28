<template>
  <div class="pa-2 d-flex ga-2 flex-column">
    <company-search />
    <company-info :company="entityData.data" />
    <comment-list :review-list="reviewListData.data" />
  </div>
</template>

<script setup lang="ts">
import CompanySearch from "./company-search.vue"
import CompanyInfo from "./company-info.vue"
import commentList from "./comment-list.vue"
import type { Review } from "../../../entities/review/model.ts"
import { searchForEntity } from "../../../entities/entity/api.ts"
import { watch, ref } from "vue"
import { useRoute } from "vuetify/lib/composables/router.mjs"
import type { Entity } from "../../../entities/entity/model.ts"
import { fetchReviews } from "../../../entities/review/api.ts"

const route = useRoute()
const entityData = ref<{ data: Entity | null; loading: boolean }>({
  data: null,
  loading: false,
})
const reviewListData = ref<{ data: Review[] | null; loading: false }>({
  data: null,
  loading: false,
})

watch(
  () => route.value?.query.search,
  async () => {
    const search = route.value?.query.search
    if (!search) {
      entityData.value.data = null
      entityData.value.loading = false
      return
    }
    entityData.value.loading = true
    try {
      const response = await searchForEntity(search.toString())
      entityData.value.data = response
      entityData.value.loading = false
    } catch {
      entityData.value.data = null
      entityData.value.loading = false
    }
  },
  { immediate: true },
)

watch(
  () => entityData.value.data?.id,
  async () => {
    const entityId = entityData.value.data?.id
    if (!entityId) {
      reviewListData.value.data = null
      reviewListData.value.loading = false
      return
    }
    try {
      const commentListResponse = await fetchReviews(entityId)
      reviewListData.value.data = commentListResponse
      reviewListData.value.loading = false
    } catch {
      reviewListData.value.data = null
      reviewListData.value.loading = false
    }
  },
)
</script>
