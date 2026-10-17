import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  Fuel,
  MapPin,
  Navigation,
  Phone,
  Plus,
  Share2,
  Star,
  User,
} from 'lucide-react'
import type { Place, PlaceStatus, StatusReport } from '../types'
import {
  CATEGORY_LABELS,
  STATUS_COLORS,
  STATUS_ORDER,
  distanceKm,
  statusLabel,
  timeAgo,
  type StatusKey,
} from '../lib/utils'

const STATUS_CARD: Record<StatusKey, { bg: string; text: string }> = {
  open: { bg: 'bg-emerald-50 ring-emerald-100', text: 'text-emerald-700' },
  closed: { bg: 'bg-red-50 ring-red-100', text: 'text-red-600' },
  out_of_stock: { bg: 'bg-amber-50 ring-amber-100', text: 'text-amber-600' },
  none: { bg: 'bg-slate-50 ring-slate-200', text: 'text-slate-500' },
}

function StarRating({ disabled, onRate }: { disabled: boolean; onRate: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center justify-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onMouseEnter={() => setHover(n)}
          onClick={() => onRate(n)}
          aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}
          className="p-1 disabled:opacity-60"
        >
          <Star
            className={`h-7 w-7 transition-colors ${
              n <= hover ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export default function DetailPanel({
  place,
  reports,
  session,
  userPos,
  saving,
  onClose,
  onStatus,
  onRate,
}: {
  place: Place | undefined
  reports: StatusReport[]
  session: Session | null
  userPos: [number, number] | null
  saving: boolean
  onClose: () => void
  onStatus: (status: PlaceStatus) => void
  onRate: (rating: number) => void
}) {
  const [rateOpen, setRateOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const shell = `${
    place ? '' : 'hidden xl:block'
  } fixed inset-x-0 bottom-0 z-[1100] lg:left-[280px] xl:static xl:z-auto xl:w-[440px] xl:shrink-0 xl:bg-slate-100 xl:p-4`
  const card =
    'max-h-[78vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl xl:h-full xl:max-h-none xl:rounded-2xl xl:shadow-sm xl:ring-1 xl:ring-slate-200'

  // Estado vazio (só em ecrãs grandes)
  if (!place) {
    return (
      <aside className={shell}>
        <div className={`${card} flex items-center justify-center p-8 text-center`}>
          <div>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <MapPin className="h-7 w-7" />
            </div>
            <div className="mt-4 text-sm font-semibold text-slate-800">Escolhe um local</div>
            <div className="mt-1 text-xs text-slate-500">
              Clica num ponto do mapa ou pesquisa pelo nome para ver os detalhes.
            </div>
          </div>
        </div>
      </aside>
    )
  }

  const status: StatusKey = place.current_status ?? 'none'
  const isPharmacy = place.category === 'pharmacy'
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`
  const directionsLink = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`
  const distance = userPos ? distanceKm(userPos, [place.lat, place.lng]) : null
  const avg = Number(place.avg_rating ?? 0)

  async function share() {
    const text = `${place!.name} · ${mapsLink}`
    try {
      if (navigator.share) {
        await navigator.share({ title: place!.name, text, url: mapsLink })
      } else {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      }
    } catch {
      /* o utilizador cancelou a partilha */
    }
  }

  return (
    <aside className={shell}>
      <div className={card}>
        {/* Cabeçalho visual (a foto do local virá numa fase futura) */}
        <div
          className={`relative flex h-36 items-center justify-center overflow-hidden xl:rounded-t-2xl ${
            isPharmacy ? 'bg-gradient-to-br from-emerald-700 to-ink' : 'bg-gradient-to-br from-brand to-ink'
          }`}
        >
          <div className="text-white/20">
            {isPharmacy ? (
              <Plus className="h-28 w-28" strokeWidth={3} />
            ) : (
              <Fuel className="h-24 w-24" strokeWidth={2} />
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Voltar"
            className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={share}
            aria-label="Partilhar"
            className="absolute right-4 top-4 flex h-10 items-center gap-2 rounded-full bg-black/40 px-3 text-white backdrop-blur transition hover:bg-black/60"
          >
            <Share2 className="h-5 w-5" />
            {copied && <span className="text-xs font-semibold">Copiado</span>}
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Identificação */}
          <div className="flex items-start gap-4">
            <div
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white ${
                isPharmacy ? 'bg-emerald-600' : 'bg-brand'
              }`}
            >
              {isPharmacy ? <Plus className="h-9 w-9" strokeWidth={3.5} /> : <Fuel className="h-8 w-8" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold leading-tight text-slate-950">{place.name}</h2>
              <div className="text-sm text-slate-500">{CATEGORY_LABELS[place.category]}</div>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`h-4 w-4 ${
                        place.review_count && n <= Math.round(avg)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                {place.review_count ? (
                  <span className="text-sm text-slate-500">
                    <strong className="text-slate-900">{avg.toFixed(1)}</strong> ({place.review_count}{' '}
                    {place.review_count === 1 ? 'avaliação' : 'avaliações'})
                  </span>
                ) : (
                  <span className="text-sm text-slate-400">Sem avaliações</span>
                )}
              </div>
            </div>
          </div>

          {/* Morada e distância */}
          <div className="flex items-start justify-between gap-3 text-sm text-slate-700">
            <span className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-900" />
              {place.address ?? 'Morada não disponível'}
            </span>
            {distance !== null && (
              <span className="flex shrink-0 items-center gap-1 text-slate-500">
                <Navigation className="h-3.5 w-3.5" />
                {distance.toFixed(1)} km
              </span>
            )}
          </div>

          {/* Estado actual em destaque */}
          <div
            className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 ring-1 ${STATUS_CARD[status].bg}`}
          >
            <div className="flex items-center gap-3">
              <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
              <div className="leading-tight">
                <div className={`text-lg font-bold ${STATUS_CARD[status].text}`}>
                  {statusLabel(status, place.category)}
                </div>
                <div className="text-xs text-slate-500">
                  {place.opening_hours ?? (status === 'none' ? 'Ainda sem reportes' : 'Horário não disponível')}
                </div>
              </div>
            </div>
            {place.status_updated_at && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="h-5 w-5 text-slate-400" />
                <span className="leading-tight">
                  Confirmado
                  <br />
                  <strong className="text-slate-700">{timeAgo(place.status_updated_at)}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Acções */}
          <div className="grid grid-cols-3 gap-2.5">
            {place.phone ? (
              <a
                href={`tel:${place.phone}`}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 py-3 text-xs text-slate-700 transition hover:bg-slate-50"
              >
                <Phone className="h-5 w-5 text-slate-900" />
                Ligar
              </a>
            ) : (
              <span
                title="Telefone não disponível"
                className="flex cursor-not-allowed flex-col items-center gap-1.5 rounded-xl border border-slate-200 py-3 text-xs text-slate-400"
              >
                <Phone className="h-5 w-5" />
                Ligar
              </span>
            )}
            <a
              href={directionsLink}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 py-3 text-xs text-slate-700 transition hover:bg-slate-50"
            >
              <Navigation className="h-5 w-5 text-slate-900" />
              Direções
            </a>
            <button
              type="button"
              onClick={() => setRateOpen((v) => !v)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs transition ${
                rateOpen ? 'border-brand bg-blue-50 text-brand' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Star className="h-5 w-5" />
              Avaliar
            </button>
          </div>

          {rateOpen && (
            <div className="rounded-2xl bg-slate-50 p-4 text-center ring-1 ring-slate-200">
              {session ? (
                <>
                  <div className="mb-1 text-sm font-semibold text-slate-800">Como avalias este local?</div>
                  <StarRating
                    disabled={saving}
                    onRate={(n) => {
                      onRate(n)
                      setRateOpen(false)
                    }}
                  />
                </>
              ) : (
                <div className="text-sm text-slate-600">Entra na tua conta para avaliar este local.</div>
              )}
            </div>
          )}

          {/* Estado actual: escolher para reportar */}
          <div>
            <h3 className="mb-2 text-sm font-bold text-slate-950">Estado atual</h3>
            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl ring-1 ring-slate-200">
              {STATUS_ORDER.map((s) => {
                const isCurrent = place.current_status === s
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={!session || saving}
                    onClick={() => onStatus(s)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                  >
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLORS[s] }} />
                    <span className="leading-tight">
                      <span className="block text-sm font-semibold text-slate-900">
                        {statusLabel(s, place.category)}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {isCurrent && place.status_updated_at
                          ? `Confirmado ${timeAgo(place.status_updated_at)}`
                          : session
                            ? 'Toca para reportar'
                            : 'Entra para reportar'}
                      </span>
                    </span>
                    {isCurrent ? (
                      <Check className="ml-auto h-5 w-5 text-emerald-600" />
                    ) : (
                      <ChevronRight className="ml-auto h-5 w-5 text-slate-300" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Últimos reportes */}
          <div>
            <h3 className="mb-2 text-sm font-bold text-slate-950">Últimos reportes</h3>
            {reports.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-4 text-center text-xs text-slate-500 ring-1 ring-slate-200">
                Ainda ninguém reportou o estado deste local.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl ring-1 ring-slate-200">
                {reports.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLORS[r.status] }} />
                    <span className="leading-tight">
                      <span className="block text-sm font-semibold text-slate-900">
                        {statusLabel(r.status, place.category)}
                      </span>
                      <span className="block text-xs capitalize text-slate-500">{timeAgo(r.created_at)}</span>
                    </span>
                    <span className="ml-auto flex items-center gap-2 text-xs text-slate-500">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100">
                        <User className="h-4 w-4 text-slate-500" />
                      </span>
                      Membro
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
