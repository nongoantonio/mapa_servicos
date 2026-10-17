import { MapPin, Navigation, X } from 'lucide-react'
import type { Place } from '../types'
import { CATEGORY_LABELS, distanceKm, formatDistance, type StatusKey } from '../lib/utils'
import { PlaceIcon, Rating, StatusChip } from './ui'

export default function PlaceCard({
  place,
  userPos,
  onClose,
  onDetails,
}: {
  place: Place
  userPos: [number, number] | null
  onClose: () => void
  onDetails: () => void
}) {
  const status: StatusKey = place.current_status ?? 'none'
  const km = userPos ? distanceKm(userPos, [place.lat, place.lng]) : null

  return (
    <div className="absolute inset-x-3 bottom-3 z-[1100] mx-auto max-w-md rounded-3xl bg-white p-4 shadow-2xl ring-1 ring-slate-200 lg:inset-x-auto lg:bottom-6 lg:left-6 lg:mx-0 lg:w-[420px]">
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex gap-3 pr-8">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200">
          <PlaceIcon category={place.category} className="h-12 w-12" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <h2 className="line-clamp-2 text-base font-bold leading-snug text-slate-950">{place.name}</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <StatusChip status={status} category={place.category} />
            <Rating avg={place.avg_rating} count={place.review_count} />
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{place.address ?? CATEGORY_LABELS[place.category]}</span>
            {km !== null && <span className="shrink-0 font-semibold text-slate-700">· {formatDistance(km)}</span>}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
        >
          <Navigation className="h-4 w-4" />
          Como chegar
        </a>
        <button
          type="button"
          onClick={onDetails}
          className="rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-95"
        >
          Ver detalhes
        </button>
      </div>
    </div>
  )
}