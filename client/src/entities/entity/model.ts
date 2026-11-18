export type Entity = {
  id: number
  slug: string
  office_id: string
  name: string | null
  review_count: number
  avg_rating: string
  last_updated_at: string | null
}

export type EntitySearchResult =
  | {
      kind: "office"
      entity: Entity
      offices: Entity[]
    }
  | {
      kind: "matches"
      offices: Entity[]
    }

export type CompanySummary = {
  slug: string
  name: string | null
  office_count: number
  review_count: number
  avg_rating: string
  offices: Entity[]
}
