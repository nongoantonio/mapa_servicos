export type PlaceStatus = 'open' | 'closed' | 'out_of_stock'

export type Place = {
  id: string
  name: string
  category: 'pharmacy' | 'fuel'
  address: string | null
  phone: string | null
  opening_hours: string | null
  lat: number
  lng: number
  current_status: PlaceStatus | null
  status_updated_at: string | null
  avg_rating: number | null
  review_count: number | null
}

export type StatusReport = {
  id: string
  status: PlaceStatus
  created_at: string
}
