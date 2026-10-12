export type Place = {
  id: string
  name: string
  category: 'pharmacy' | 'fuel'
  address: string | null
  lat: number
  lng: number
  current_status: 'open' | 'closed' | 'out_of_stock' | null
}