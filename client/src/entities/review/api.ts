import { request } from "../../shared/api"
import type { Review } from "./model"

export async function fetchReviews(entityId: number) {
  return await request<Review[]>(`/entities/${entityId}/reviews`)
}

export async function fetchCompanyReviews(slug: string) {
  return await request<Review[]>(
    `/entities/company/${encodeURIComponent(slug)}/reviews`,
  )
}
