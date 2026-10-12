export type PlaceStatus = 'open' | 'closed' | 'out_of_stock'

export type Place = {
  id: string
  name: string
  category: 'pharmacy' | 'fuel'
  address: string | null
  lat: number
  lng: number
  current_status: PlaceStatus | null
  status_updated_at: string | null
}