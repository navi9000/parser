import { request } from "../../shared/api"
import type { Entity } from "./model"

export async function searchForEntity(input: string) {
  return await request<Entity | null>(`/entities/search?v=${input}`)
}
