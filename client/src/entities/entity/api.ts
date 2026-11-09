import { request } from "../../shared/api"
import type {
  CompanySummary,
  Entity,
  EntitySearchResult,
  ScrapeJobStatus,
} from "./model"

export async function searchForEntity(input: string) {
  return await request<EntitySearchResult>(
    `/entities/search?v=${encodeURIComponent(input)}`,
  )
}

export async function fetchEntity(entityId: number) {
  return await request<Entity>(`/entities/${entityId}`)
}

export async function fetchCompany(slug: string) {
  return await request<CompanySummary>(`/entities/company/${encodeURIComponent(slug)}`)
}

export async function requestEntityRefresh(entityId: number) {
  return await request<{ jobId: string }>(`/entities/${entityId}/refresh`, {
    method: "POST",
  })
}

export async function fetchScrapeJobStatus(jobId: string) {
  return await request<ScrapeJobStatus>(
    `/entities/jobs/${encodeURIComponent(jobId)}`,
  )
}
