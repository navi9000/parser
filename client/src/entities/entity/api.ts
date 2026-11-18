import { request, requestEvent } from "../../shared/api"
import type {
  CompanySummary,
  Entity,
  EntitySearchResult,
  ScrapeJobCompletion,
  ScrapeJobEvent,
} from "./model"

export async function searchForEntity(input: string) {
  return await request<EntitySearchResult>(
    `/entities/search?v=${encodeURIComponent(input)}`,
  )
}

export async function fetchEntity(entityId: number, signal?: AbortSignal) {
  return await request<Entity>(`/entities/${entityId}`, { signal })
}

export async function fetchCompany(slug: string) {
  return await request<CompanySummary>(`/entities/company/${encodeURIComponent(slug)}`)
}

export async function requestEntityRefresh(entityId: number) {
  return await request<{ jobId: string }>(`/entities/${entityId}/refresh`, {
    method: "POST",
  })
}

export async function waitForScrapeJob(
  jobId: string,
  signal: AbortSignal,
): Promise<ScrapeJobCompletion> {
  const event = await requestEvent<ScrapeJobEvent>(
    `/entities/jobs/${encodeURIComponent(jobId)}/events`,
    signal,
  )
  if (event.status === "failed") {
    return event
  }
  return {
    status: "completed",
    entity: await fetchEntity(event.entityId, signal),
  }
}
