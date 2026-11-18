import { request } from "../../shared/api"
import type {
  CompanySummary,
  Entity,
  EntitySearchResult,
  ScrapeJobCompletion,
  ScrapeJobStatus,
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

async function fetchScrapeJobStatus(jobId: string, signal?: AbortSignal) {
  return await request<ScrapeJobStatus>(
    `/entities/jobs/${encodeURIComponent(jobId)}`,
    { signal },
  )
}
export async function waitForScrapeJob(
  jobId: string,
  signal: AbortSignal,
): Promise<ScrapeJobCompletion> {
  while (true) {
    const job = await fetchScrapeJobStatus(jobId, signal)
    if (job.status === "completed") {
      const entity = await fetchEntity(job.entityId, signal)
      return { status: "completed", entity }
    }
    if (job.status === "failed") {
      return { status: "failed", failedReason: job.failedReason }
    }

    await new Promise<void>((resolve) => window.setTimeout(resolve, 1000))
  }
}
