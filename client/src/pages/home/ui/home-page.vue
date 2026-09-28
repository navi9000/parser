<template>
  <div class="home-page pa-2 d-flex ga-2 flex-column h-screen overflow-hidden">
    <div class="home-page__top-section d-flex ga-2 flex-column">
      <company-search />
      <company-info
        :company="entityData.data"
        :error="entityData.error"
        :loading="entityData.loading"
      />
    </div>
    <comment-list
      :review-list="reviewListData.data"
      :loading="reviewListData.loading"
    />
  </div>
</template>

<script setup lang="ts">
import CompanySearch from "./company-search.vue"
import CompanyInfo from "./company-info.vue"
import commentList from "./comment-list.vue"
import { type Entity, searchForEntity } from "../../../entities/entity"
import { type Review, fetchReviews } from "../../../entities/review"
import { watch, ref } from "vue"
import { useRoute } from "vue-router"

const route = useRoute()
const entityData = ref<{
  data: Entity | null
  loading: boolean
  error: boolean
}>({
  data: null,
  loading: false,
  error: false,
})
const reviewListData = ref<{
  data: Review[] | null
  loading: false
  error: boolean
}>({
  data: null,
  loading: false,
  error: false,
})

watch(
  () => route.query?.search,
  async () => {
    const search = route.query?.search
    if (!search) {
      entityData.value.data = null
      entityData.value.loading = false
      entityData.value.error = false
      return
    }
    entityData.value.loading = true
    entityData.value.error = false
    try {
      const response = await searchForEntity(search.toString())
      entityData.value.data = response
      entityData.value.loading = false
      entityData.value.error = response === null
    } catch {
      entityData.value.data = null
      entityData.value.loading = false
      entityData.value.error = true
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
      reviewListData.value.error = false
      return
    }
    try {
      const commentListResponse = await fetchReviews(entityId)
      reviewListData.value.data = commentListResponse
      reviewListData.value.loading = false
      reviewListData.value.error = !commentListResponse.length
    } catch {
      reviewListData.value.data = null
      reviewListData.value.loading = false
      reviewListData.value.error = true
    }
  },
)
</script>

<style scoped>
:global(html),
:global(body),
:global(#app) {
  height: 100%;
  overflow: hidden;
}

.home-page {
  box-sizing: border-box;
}

.home-page__top-section {
  flex: 0 0 294px;
}
</style>
