<template>
  <div class="home-page pa-2 d-flex ga-2 flex-column h-screen overflow-hidden">
    <div class="home-page__top-section d-flex ga-2 flex-column">
      <CompanySearch />
      <CompanyInfo
        :company="displayCompany"
        :offices="offices"
        :selected-office-id="selectedOfficeId"
        :scope="scope"
        :loading="searchLoading || companyLoading"
        :searching="searchState === 'pending'"
        :error="searchError"
        :job-error="jobError"
        :refreshing="refreshing"
        @select-office="selectOffice"
        @toggle-view="toggleView"
        @refresh="refreshSelectedOffice"
      />
    </div>
    <CommentList :review-list="reviewList" :loading="reviewsLoading" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue"
import { useRoute } from "vue-router"
import CompanySearch from "./company-search.vue"
import CompanyInfo from "./company-info.vue"
import CommentList from "./comment-list.vue"
import {
  fetchCompany,
  fetchEntity,
  fetchScrapeJobStatus,
  requestEntityRefresh,
  searchForEntity,
  type CompanySummary,
  type Entity,
} from "../../../entities/entity"
import {
  fetchCompanyReviews,
  fetchReviews,
  type Review,
} from "../../../entities/review"
import { ApiError } from "../../../shared/api"

const route = useRoute()
const offices = ref<Entity[]>([])
const selectedOfficeId = ref<number | null>(null)
const scope = ref<"office" | "company">("office")
const companySummary = ref<CompanySummary | null>(null)
const reviewList = ref<Review[] | null>(null)
const searchState = ref<"idle" | "loading" | "pending" | "ready">("idle")
const searchLoading = ref(false)
const companyLoading = ref(false)
const reviewsLoading = ref(false)
const refreshing = ref(false)
const searchError = ref<string | null>(null)
const jobError = ref<string | null>(null)

const selectedOffice = computed(
  () => offices.value.find((office) => office.id === selectedOfficeId.value) ?? null,
)
const displayCompany = computed(() =>
  scope.value === "company" ? companySummary.value : selectedOffice.value,
)

let operation = 0
let viewOperation = 0
let pollTimer: number | undefined
let polling = false
let pollGeneration = 0

function stopPolling() {
  pollGeneration += 1
  if (pollTimer !== undefined) {
    window.clearInterval(pollTimer)
    pollTimer = undefined
  }
  polling = false
}

function setOffices(nextOffices: Entity[], preferredId?: number) {
  offices.value = nextOffices
  selectedOfficeId.value =
    nextOffices.find((office) => office.id === preferredId)?.id ??
    nextOffices[0]?.id ??
    null
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "An unexpected error occurred"
}

async function loadSelectedView(currentOperation = operation) {
  const currentViewOperation = ++viewOperation
  const office = selectedOffice.value
  if (!office) {
    companySummary.value = null
    reviewList.value = null
    reviewsLoading.value = false
    return
  }

  reviewsLoading.value = true
  if (scope.value === "company") {
    companyLoading.value = true
    try {
      const [summary, reviews] = await Promise.all([
        fetchCompany(office.slug),
        fetchCompanyReviews(office.slug),
      ])
      if (
        currentOperation !== operation ||
        currentViewOperation !== viewOperation
      ) {
        return
      }
      companySummary.value = summary
      reviewList.value = reviews
    } catch (error) {
      if (
        currentOperation !== operation ||
        currentViewOperation !== viewOperation
      ) {
        return
      }
      companySummary.value = null
      reviewList.value = null
      searchError.value = errorMessage(error)
    } finally {
      if (
        currentOperation === operation &&
        currentViewOperation === viewOperation
      ) {
        companyLoading.value = false
        reviewsLoading.value = false
      }
    }
    return
  }

  companySummary.value = null
  try {
    const reviews = await fetchReviews(office.id)
    if (
      currentOperation !== operation ||
      currentViewOperation !== viewOperation
    ) {
      return
    }
    reviewList.value = reviews
  } catch (error) {
    if (
      currentOperation === operation &&
      currentViewOperation === viewOperation
    ) {
      reviewList.value = null
      searchError.value = errorMessage(error)
    }
  } finally {
    if (
      currentOperation === operation &&
      currentViewOperation === viewOperation
    ) {
      reviewsLoading.value = false
    }
  }
}

function startPolling(jobId: string, entityId: number) {
  stopPolling()
  const generation = pollGeneration
  jobError.value = null
  pollTimer = window.setInterval(async () => {
    if (polling) return
    polling = true
    try {
      const status = await fetchScrapeJobStatus(jobId)
      if (generation !== pollGeneration) return
      if (status.status === "completed") {
        const entity = await fetchEntity(entityId)
        if (generation !== pollGeneration) return
        stopPolling()
        offices.value = offices.value.map((office) =>
          office.id === entity.id ? entity : office,
        )
        searchState.value = "ready"
        refreshing.value = false
        jobError.value = null
        await loadSelectedView()
      } else if (status.status === "failed") {
        stopPolling()
        searchState.value = "ready"
        refreshing.value = false
        jobError.value = status.failedReason ?? "The scrape job failed"
      }
    } catch (error) {
      if (generation !== pollGeneration) return
      if (error instanceof ApiError && error.status === 404) {
        stopPolling()
        searchState.value = "ready"
        refreshing.value = false
      }
      jobError.value = `Unable to check scrape status: ${errorMessage(error)}`
    } finally {
      if (generation === pollGeneration) {
        polling = false
      }
    }
  }, 2000)
}

async function loadSearch(input: string) {
  const currentOperation = ++operation
  stopPolling()
  offices.value = []
  selectedOfficeId.value = null
  scope.value = "office"
  companySummary.value = null
  reviewList.value = null
  searchError.value = null
  jobError.value = null
  refreshing.value = false

  if (!input) {
    searchState.value = "idle"
    searchLoading.value = false
    return
  }

  searchLoading.value = true
  searchState.value = "loading"
  try {
    const result = await searchForEntity(input)
    if (currentOperation !== operation) return

    if (result.kind === "matches") {
      setOffices(result.offices)
      searchState.value = "ready"
      await loadSelectedView(currentOperation)
    } else {
      setOffices(result.offices, result.entity.id)
      if (result.kind === "pending") {
        searchState.value = "pending"
        refreshing.value = true
        void loadSelectedView(currentOperation)
        startPolling(result.jobId, result.entity.id)
      } else {
        searchState.value = "ready"
        await loadSelectedView(currentOperation)
      }
    }
  } catch (error) {
    if (currentOperation === operation) {
      searchState.value = "idle"
      searchError.value = errorMessage(error)
    }
  } finally {
    if (currentOperation === operation) {
      searchLoading.value = false
    }
  }
}

function selectOffice(officeId: number) {
  selectedOfficeId.value = officeId
  scope.value = "office"
  searchError.value = null
  void loadSelectedView()
}

function toggleView() {
  scope.value = scope.value === "office" ? "company" : "office"
  searchError.value = null
  void loadSelectedView()
}

async function refreshSelectedOffice() {
  const office = selectedOffice.value
  if (!office) return

  try {
    const { jobId } = await requestEntityRefresh(office.id)
    refreshing.value = true
    startPolling(jobId, office.id)
  } catch (error) {
    jobError.value = errorMessage(error)
  }
}

watch(
  () => route.query.search,
  (search) => void loadSearch(typeof search === "string" ? search.trim() : ""),
  { immediate: true },
)

onBeforeUnmount(stopPolling)
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
