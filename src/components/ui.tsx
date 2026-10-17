import { Fuel, Plus, Star } from 'lucide-react'
import type { Place } from '../types'
import { statusLabel, type StatusKey } from '../lib/utils'

export const CHIP: Record<StatusKey, string> = {
  open: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  closed: 'bg-red-50 text-red-700 ring-red-200',
  out_of_stock: 'bg-amber-50 text-amber-700 ring-amber-200',
  none: 'bg-slate-100 text-slate-500 ring-slate-200',
}

export const DOT: Record<StatusKey, string> = {
  open: 'bg-emerald-500',
  closed: 'bg-red-500',
  out_of_stock: 'bg-amber-500',
  none: 'bg-slate-400',
}

/** Círculo com o símbolo do tipo de local: cruz (farmácia) ou bomba (combustível) */
export function PlaceIcon({
  category,
  className = 'h-12 w-12',
}: {
  category: Place['category']
  className?: string
}) {
  const pharmacy = category === 'pharmacy'
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full text-white ${
        pharmacy ? 'bg-emerald-600' : 'bg-blue-600'
      } ${className}`}
    >
      {pharmacy ? (
        <Plus className="h-[58%] w-[58%]" strokeWidth={3.5} />
      ) : (
        <Fuel className="h-[52%] w-[52%]" />
      )}
    </span>
  )
}

export function StatusChip({
  status,
  category,
  className = '',
}: {
  status: StatusKey
  category: Place['category']
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${CHIP[status]} ${className}`}
    >
      <span className={`h-2 w-2 rounded-full ${DOT[status]}`} />
      {statusLabel(status, category)}
    </span>
  )
}

export function Rating({ avg, count }: { avg: number | null; count: number | null }) {
  if (!count) return <span className="text-xs text-slate-400">Sem avaliações</span>
  return (
    <span className="flex items-center gap-1 text-xs text-slate-500">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      <strong className="text-slate-900">{Number(avg ?? 0).toFixed(1)}</strong>
      <span>
        ({count} {count === 1 ? 'avaliação' : 'avaliações'})
      </span>
    </span>
  )
}