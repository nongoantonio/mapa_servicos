import { useMemo, useState } from 'react'
import { Fuel, Loader2, LocateFixed, Map as MapIcon, Navigation, Plus } from 'lucide-react'
import type { Place } from '../types'
import { distanceKm, formatDistance, timeAgo, type StatusKey } from '../lib/utils'
import { PlaceIcon, StatusChip } from './ui'

export default function ResultsList({
  places,
  category,
  onCategory,
  userPos,
  locating,
  locationError,
  onLocate,
  onShowMap,
}: {
  places: Place[]
  category: Place['category']
  onCategory: (c: Place['category']) => void
  userPos: [number, number] | null
  locating: boolean
  locationError: string | null
  onLocate: () => void
  onShowMap: (placeId: string) => void
}) {
  const [onlyOpen, setOnlyOpen] = useState(false)
  const [limit, setLimit] = useState(15)

  const sorted = useMemo(() => {
    const list = places
      .filter((p) => p.category === category)
      .map((place) => ({
        place,
        km: userPos ? distanceKm(userPos, [place.lat, place.lng]) : 0,
      }))
    list.sort((a, b) => a.km - b.km)
    return list
  }, [places, category, userPos])

  const filtered = onlyOpen ? sorted.filter((x) => x.place.current_status === 'open') : sorted
  const shown = filtered.slice(0, limit)

  // Sem localização não mostramos a lista: só faz sentido ordenada por distância
  if (!userPos) {
    return (
      <div className="absolute inset-0 z-[1400] flex flex-col items-center justify-center overflow-y-auto bg-gradient-to-b from-ink to-ink-soft px-6 text-center text-white">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30">
          <LocateFixed className="h-10 w-10 text-white" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Precisamos da tua localização</h1>
        <p className="mt-3 max-w-sm text-base text-slate-300">
          Para te mostrar os locais mais perto, a app precisa de saber onde estás.
        </p>

        {locationError && (
          <div className="mt-5 w-full max-w-sm rounded-2xl bg-amber-50 p-4 text-left text-sm text-amber-900 ring-1 ring-amber-200">
            {locationError}
          </div>
        )}

        <button
          type="button"
          onClick={onLocate}
          disabled={locating}
          className="mt-6 flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-base font-semibold text-white shadow-lg transition active:scale-[0.98] disabled:opacity-70"
        >
          {locating ? <Loader2 className="h-5 w-5 animate-spin" /> : <LocateFixed className="h-5 w-5" />}
          {locating ? 'A procurar a tua localização...' : 'Ativar localização'}
        </button>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-[1400] overflow-y-auto bg-slate-100">
      <div className="mx-auto max-w-2xl space-y-3 p-4 pb-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Perto de ti</h1>
          <p className="text-sm text-slate-500">Da mais próxima para a mais distante</p>
        </div>

        {/* Farmácias ou bombas */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1 ring-1 ring-slate-200">
          {[
            { id: 'pharmacy' as const, label: 'Farmácias', icon: Plus },
            { id: 'fuel' as const, label: 'Bombas', icon: Fuel },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                onCategory(id)
                setLimit(15)
              }}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                category === id ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={id === 'pharmacy' ? 3 : 2} />
              {label}
            </button>
          ))}
        </div>

        {/* Só abertas */}
        <button
          type="button"
          onClick={() => {
            setOnlyOpen((v) => !v)
            setLimit(15)
          }}
          className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-left ring-1 ring-slate-200"
        >
          <span>
            <span className="block text-sm font-semibold text-slate-900">Mostrar só as abertas</span>
            <span className="block text-xs text-slate-500">Confirmadas pela comunidade</span>
          </span>
          <span
            className={`relative h-7 w-12 rounded-full transition-colors ${
              onlyOpen ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                onlyOpen ? 'left-6' : 'left-1'
              }`}
            />
          </span>
        </button>

        {places.length === 0 && (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 ring-1 ring-slate-200">
            A carregar locais...
          </div>
        )}

        {places.length > 0 && shown.length === 0 && (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-600 ring-1 ring-slate-200">
            Ainda nenhum local está confirmado como aberto. Desliga o filtro para ver todos e, quando
            passares por um, confirma o estado para ajudar os outros.
          </div>
        )}

        {shown.map(({ place, km }) => {
          const status: StatusKey = place.current_status ?? 'none'
          return (
            <article key={place.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-start gap-3">
                <PlaceIcon category={place.category} className="h-12 w-12" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold leading-snug text-slate-950">{place.name}</h2>
                  {place.address && <div className="mt-0.5 text-sm text-slate-500">{place.address}</div>}
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-lg font-bold leading-tight text-slate-950">{formatDistance(km)}</div>
                  <div className="text-[11px] text-slate-400">de ti</div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusChip status={status} category={place.category} />
                <span className="text-xs text-slate-500">
                  {place.status_updated_at
                    ? `Confirmado ${timeAgo(place.status_updated_at)}`
                    : 'Ninguém confirmou ainda'}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-95"
                >
                  <Navigation className="h-4 w-4" />
                  Como chegar
                </a>
                <button
                  type="button"
                  onClick={() => onShowMap(place.id)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
                >
                  <MapIcon className="h-4 w-4" />
                  Ver no mapa
                </button>
              </div>
            </article>
          )
        })}

        {filtered.length > shown.length && (
          <button
            type="button"
            onClick={() => setLimit((l) => l + 15)}
            className="w-full rounded-2xl bg-white py-3 text-sm font-semibold text-emerald-700 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Mostrar mais ({filtered.length - shown.length})
          </button>
        )}
      </div>
    </div>
  )
}