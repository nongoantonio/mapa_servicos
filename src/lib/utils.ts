import type { Place, PlaceStatus } from '../types'

export type StatusKey = PlaceStatus | 'none'

export const STATUS_ORDER: PlaceStatus[] = ['open', 'closed', 'out_of_stock']

export const STATUS_COLORS: Record<StatusKey, string> = {
  open: '#16a34a',
  closed: '#ef4444',
  out_of_stock: '#f59e0b',
  none: '#94a3b8',
}

export const CATEGORY_LABELS = { pharmacy: 'Farmácia', fuel: 'Bomba de combustível' } as const

export function statusLabel(status: StatusKey, category: Place['category']) {
  if (status === 'open') return 'Aberto'
  if (status === 'closed') return 'Fechado'
  if (status === 'out_of_stock') return category === 'fuel' ? 'Sem combustível' : 'Sem stock'
  return 'Sem informação'
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`
}

/** "há 12 minutos", "há 2 horas", "agora mesmo" */
export function timeAgo(iso: string) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'agora mesmo'
  if (minutes < 60) return `há ${plural(minutes, 'minuto', 'minutos')}`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${plural(hours, 'hora', 'horas')}`
  return `há ${plural(Math.floor(hours / 24), 'dia', 'dias')}`
}

/** Distância em km entre dois pontos [lat, lng] (fórmula de Haversine) */
export function distanceKm(a: [number, number], b: [number, number]) {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** "850 m" ou "1,2 km" */
export function formatDistance(km: number) {
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`
  return `${km.toFixed(1).replace('.', ',')} km`
}

/** Minúsculas e sem acentos, para pesquisar "farmacia" e encontrar "Farmácia" */
export function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}