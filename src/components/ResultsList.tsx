import { useMemo, useState } from 'react'
import { ArrowLeft, Droplet, Loader2, LocateFixed, Map as MapIcon, Navigation, Plus } from 'lucide-react'
import type { Place } from '../types'
import {
  distanceKm,
  formatDistance,
  statusLabel,
  timeAgo,
  type StatusKey,
} from '../lib/utils'

const CHIP: Record<StatusKey, string> = {
  open: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  closed: 'bg-red-50 text-red-700 ring-red-200',
  out_of_stock: 'bg-amber-50 text-amber-700 ring-amber-200',
  none: 'bg-slate-100 text-slate-500 ring-slate-200',
}

const DOT: Record<StatusKey, string> = {
  open: 'bg-emerald-500',
  closed: 'bg-red-500',
  out_of_stock: 'bg-amber-500',
  none: 'bg-slate-400',
}

export default function ResultsList({
  places,
  category,
  userPos,
  locating,
  locationError,
  onLocate,
  onBack,
  onShowMap,
}: {
  places: Place[]
  category: Place['category']
  userPos: [number, number] | null
  locating: boolean
  locationError: string | null
  onLocate: () => void
  onBack: () => void
  onShowMap: (placeId: string | null) => void
}) {
  const [onlyOpen, setOnlyOpen] = useState(false)
  const [limit, setLimit] = useState(15)

  const title = category === 'pharmacy' ? 'Farmácias' : 'Bombas de combustível'

  const sorted = useMemo(() => {
    const list = places
      .filter((p) => p.category === category)
      .map((place) => ({
        place,
        km: userPos ? distanceKm(userPos, [place.lat, place.lng]) : null,
      }))
    list.sort((a, b) => (a.km ?? 0) - (b.km ?? 0))
    return list
  }, [places, category, userPos])

  const filtered = onlyOpen ? sorted.filter((x) => x.place.current_status === 'open') : sorted
  const shown = filtered.slice(0, limit)

  // Sem localização não mostramos a lista: só faz sentido ordenada por distância
  if (!userPos) {
    return (
      <div className="flex min-h-screen w-screen flex-col bg-gradient-to-b from-ink to-ink-soft px-5 py-6 text-white">
        <div className="mx-auto w-full max-w-md">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-full bg-white/10 py-2 pl-3 pr-4 text-sm font-medium transition hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand shadow-lg shadow-brand/40">
            <LocateFixed className="h-10 w-10 text-white" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Precisamos da tua localização</h1>
          <p className="mt-3 text-base text-slate-300">
            Para te mostrar {category === 'pharmacy' ? 'as farmácias' : 'as bombas'} mais perto, a app
            precisa de saber onde estás.
          </p>

          {locationError && (
            <div className="mt-5 w-full rounded-2xl bg-amber-50 p-4 text-left text-sm text-amber-900 ring-1 ring-amber-200">
              {locationError}
            </div>
          )}

          <button
            type="button"
            onClick={onLocate}
            disabled={locating}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-base font-semibold text-white shadow-lg transition active:scale-[0.98] disabled:opacity-70"
          >
            {locating ? <Loader2 className="h-5 w-5 animate-spin" /> : <LocateFixed className="h-5 w-5" />}
            {locating ? 'A procurar a tua localização...' : 'Ativar localização'}
          </button>

          <button
            type="button"
            onClick={() => onShowMap(null)}
            className="mt-5 text-sm font-medium text-sky-300 underline-offset-4 hover:underline"
          >
            Prefiro ver tudo no mapa
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-100">
      {/* Topo */}
      <header className="bg-ink px-4 pb-5 pt-4 text-white">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-full bg-white/10 py-2 pl-3 pr-4 text-sm font-medium transition hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <h1 className="mt-4 text-2xl font-bold">
            {title} perto de ti
          </h1>
          <p className="mt-1 text-sm text-slate-300">Da mais próxima para a mais distante</p>
        </div>
      </header>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-3 p-4 pb-28">
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
            const isPharmacy = place.category === 'pharmacy'
            return (
              <article key={place.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white ${
                      isPharmacy ? 'bg-emerald-600' : 'bg-brand'
                    }`}
                  >
                    {isPharmacy ? <Plus className="h-7 w-7" strokeWidth={3.5} /> : <Droplet className="h-6 w-6" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold leading-snug text-slate-950">{place.name}</h2>
                    {place.address && <div className="mt-0.5 text-sm text-slate-500">{place.address}</div>}
                  </div>
                  {km !== null && (
                    <div className="shrink-0 text-right">
                      <div className="text-lg font-bold leading-tight text-slate-950">{formatDistance(km)}</div>
                      <div className="text-[11px] text-slate-400">de ti</div>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 ${CHIP[status]}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${DOT[status]}`} />
                    {statusLabel(status, place.category)}
                  </span>
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
                    className="flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95"
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
              className="w-full rounded-2xl bg-white py-3 text-sm font-semibold text-brand ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Mostrar mais ({filtered.length - shown.length})
            </button>
          )}
        </div>
      </div>

      {/* Botão fixo para o mapa */}
      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white p-3">
        <button
          type="button"
          onClick={() => onShowMap(null)}
          className="mx-auto flex w-full max-w-2xl items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 text-sm font-semibold text-white transition active:scale-[0.98]"
        >
          <MapIcon className="h-5 w-5" />
          Ver todos no mapa
        </button>
      </div>
    </div>
  )
}