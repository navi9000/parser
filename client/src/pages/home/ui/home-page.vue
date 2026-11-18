<template>
  <div class="home-page pa-2 d-flex ga-2 flex-column h-screen overflow-hidden">
    <div class="home-page__top-section d-flex ga-2 flex-column">
      <CompanySearch />
      <CompanyInfo
        :company="displayCompany"
        :offices="offices"
        :selected-office-id="selectedOfficeId"
        :scope="scope"
        :loading="searchLoading || companyLoading || reviewsLoading"
        :searching="searching"
        :error="searchError"
        :refresh-error="refreshError"
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
import { useRoute, useRouter } from "vue-router"
import CompanySearch from "./company-search.vue"
import CompanyInfo from "./company-info.vue"
import CommentList from "./comment-list.vue"
import {
  fetchCompany,
  requestEntityRefresh,
  searchForEntity,
  waitForScrapeJob,
  type CompanySummary,
  type Entity,
} from "../../../entities/entity"
import {
  fetchCompanyReviews,
  fetchReviews,
  type Review,
} from "../../../entities/review"

const route = useRoute()
const router = useRouter()
const offices = ref<Entity[]>([])
const selectedOfficeId = ref<number | null>(null)
const scope = ref<"office" | "company">("office")
const companySummary = ref<CompanySummary | null>(null)
const reviewList = ref<Review[] | null>(null)
const searching = ref(false)
const searchLoading = ref(false)
const companyLoading = ref(false)
const reviewsLoading = ref(false)
const refreshing = ref(false)
const searchError = ref<string | null>(null)
const refreshError = ref<string | null>(null)

const selectedOffice = computed(
  () => offices.value.find((office) => office.id === selectedOfficeId.value) ?? null,
)
const displayCompany = computed(() =>
  scope.value === "company" ? companySummary.value : selectedOffice.value,
)

let operation = 0
let viewOperation = 0
let scrapeWaitController: AbortController | undefined
let scrapeWaitGeneration = 0
let skipNormalizedSearch: { search: string; officeId: string } | null = null

function stopScrapeWait() {
  scrapeWaitGeneration += 1
  scrapeWaitController?.abort()
  scrapeWaitController = undefined
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

function normalizeOfficeSearch(entity: Entity) {
  if (!entity.name) return
  if (
    route.query.search === entity.name &&
    route.query.office_id === entity.office_id
  ) {
    return
  }

  skipNormalizedSearch = {
    search: entity.name,
    officeId: entity.office_id,
  }
  void router.replace({
    path: "/",
    query: { search: entity.name, office_id: entity.office_id },
  })
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

async function waitForScrapeCompletion(
  jobId: string,
  currentOperation: number,
  isSearch = false,
) {
  stopScrapeWait()
  const generation = scrapeWaitGeneration
  const controller = new AbortController()
  scrapeWaitController = controller
  searching.value = isSearch
  refreshing.value = true
  refreshError.value = null

  try {
    const result = await waitForScrapeJob(jobId, controller.signal)
    if (
      generation !== scrapeWaitGeneration ||
      currentOperation !== operation
    ) {
      return
    }

    searching.value = false
    refreshing.value = false
    if (result.status === "completed") {
      offices.value = offices.value.map((office) =>
        office.id === result.entity.id ? result.entity : office,
      )
      normalizeOfficeSearch(result.entity)
      await loadSelectedView(currentOperation)
    } else {
      refreshError.value = result.message
    }
  } catch (error) {
    if (
      generation === scrapeWaitGeneration &&
      currentOperation === operation &&
      !controller.signal.aborted
    ) {
      searching.value = false
      refreshing.value = false
      refreshError.value = errorMessage(error)
    }
  } finally {
    if (
      generation === scrapeWaitGeneration &&
      scrapeWaitController === controller
    ) {
      scrapeWaitController = undefined
    }
  }
}

async function loadSearch(input: string, officeId?: string) {
  const currentOperation = ++operation
  stopScrapeWait()
  offices.value = []
  selectedOfficeId.value = null
  scope.value = "office"
  companySummary.value = null
  reviewList.value = null
  searching.value = false
  searchError.value = null
  refreshError.value = null
  refreshing.value = false
  searchLoading.value = false
  companyLoading.value = false
  reviewsLoading.value = false

  if (!input) {
    return
  }

  searchLoading.value = true
  try {
    const result = await searchForEntity(input)
    if (currentOperation !== operation) return

    if (result.kind === "matches") {
      const requestedOffice = result.offices.find(
        (office) => office.office_id === officeId,
      )
      scope.value = requestedOffice ? "office" : "company"
      setOffices(result.offices, requestedOffice?.id)
      await loadSelectedView(currentOperation)
    } else {
      setOffices(result.offices, result.entity.id)
      if (result.kind === "pending") {
        void waitForScrapeCompletion(
          result.jobId,
          currentOperation,
          true,
        )
      } else {
        normalizeOfficeSearch(result.entity)
        await loadSelectedView(currentOperation)
      }
    }
  } catch (error) {
    if (currentOperation === operation) {
      searchError.value = errorMessage(error)
    }
  } finally {
    if (currentOperation === operation) {
      searchLoading.value = false
    }
  }
}

function selectOffice(officeId: number) {
  if (reviewsLoading.value || companyLoading.value) return
  const office = offices.value.find((item) => item.id === officeId)
  if (!office) return

  selectedOfficeId.value = officeId
  scope.value = "office"
  searchError.value = null
  if (route.query.office_id !== office.office_id) {
    void router.replace({
      path: "/",
      query: { ...route.query, office_id: office.office_id },
    })
    return
  }
  void loadSelectedView()
}

function toggleView() {
  if (reviewsLoading.value || companyLoading.value) return
  const nextScope = scope.value === "office" ? "company" : "office"
  scope.value = nextScope
  searchError.value = null
  const office = selectedOffice.value
  const officeId = nextScope === "office" ? office?.office_id : undefined
  if (route.query.office_id !== officeId) {
    void router.replace({
      path: "/",
      query: { ...route.query, office_id: officeId },
    })
    return
  }
  void loadSelectedView()
}

async function refreshSelectedOffice() {
  const office = selectedOffice.value
  if (!office) return
  const currentOperation = operation
  refreshing.value = true
  refreshError.value = null

  try {
    const { jobId } = await requestEntityRefresh(office.id)
    if (currentOperation !== operation) return
    void waitForScrapeCompletion(jobId, currentOperation)
  } catch (error) {
    if (currentOperation === operation) {
      refreshError.value = errorMessage(error)
      refreshing.value = false
    }
  }
}

watch(
  () => [route.query.search, route.query.office_id],
  ([search, officeId]) => {
    const nextSearch = typeof search === "string" ? search.trim() : ""
    const nextOfficeId =
      typeof officeId === "string" ? officeId.trim() : ""
    if (
      skipNormalizedSearch?.search === nextSearch &&
      skipNormalizedSearch.officeId === nextOfficeId
    ) {
      skipNormalizedSearch = null
      return
    }
    skipNormalizedSearch = null
    void loadSearch(nextSearch, nextOfficeId || undefined)
  },
  { immediate: true },
)

onBeforeUnmount(stopScrapeWait)
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
