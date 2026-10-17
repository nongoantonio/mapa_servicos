import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  ArrowLeft,
  Check,
  Clock,
  MapPin,
  Navigation,
  Phone,
  Share2,
  Star,
  User,
} from 'lucide-react'
import type { Place, PlaceStatus, StatusReport } from '../types'
import {
  CATEGORY_LABELS,
  STATUS_ORDER,
  distanceKm,
  formatDistance,
  statusLabel,
  timeAgo,
  type StatusKey,
} from '../lib/utils'
import { DOT, PlaceIcon, Rating, StatusChip } from './ui'

const STATUS_CARD: Record<StatusKey, { bg: string; text: string }> = {
  open: { bg: 'bg-emerald-50 ring-emerald-100', text: 'text-emerald-700' },
  closed: { bg: 'bg-red-50 ring-red-100', text: 'text-red-600' },
  out_of_stock: { bg: 'bg-amber-50 ring-amber-100', text: 'text-amber-600' },
  none: { bg: 'bg-slate-50 ring-slate-200', text: 'text-slate-500' },
}

const REPORT_BTN: Record<PlaceStatus, string> = {
  open: 'bg-emerald-600 hover:bg-emerald-700',
  closed: 'bg-red-600 hover:bg-red-700',
  out_of_stock: 'bg-amber-500 hover:bg-amber-600',
}

function StarPicker({ disabled, onRate }: { disabled: boolean; onRate: (n: number) => void }) {
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
            className={`h-8 w-8 transition-colors ${
              n <= hover ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export default function DetailScreen({
  place,
  reports,
  session,
  userPos,
  saving,
  onClose,
  onStatus,
  onRate,
}: {
  place: Place
  reports: StatusReport[]
  session: Session | null
  userPos: [number, number] | null
  saving: boolean
  onClose: () => void
  onStatus: (status: PlaceStatus) => Promise<boolean>
  onRate: (rating: number) => Promise<boolean>
}) {
  const [reportOpen, setReportOpen] = useState(false)
  const [rateOpen, setRateOpen] = useState(false)
  const [thanks, setThanks] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const status: StatusKey = place.current_status ?? 'none'
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`
  const directionsLink = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`
  const km = userPos ? distanceKm(userPos, [place.lat, place.lng]) : null

  function showThanks(message: string) {
    setThanks(message)
    setTimeout(() => setThanks(null), 3500)
  }

  async function report(s: PlaceStatus) {
    const ok = await onStatus(s)
    if (ok) {
      setReportOpen(false)
      showThanks('Obrigado! Ajudaste outras pessoas a saber como está este local.')
    }
  }

  async function rate(n: number) {
    const ok = await onRate(n)
    if (ok) {
      setRateOpen(false)
      showThanks('Obrigado pela tua avaliação!')
    }
  }

  async function share() {
    const text = `${place.name} · ${mapsLink}`
    try {
      if (navigator.share) {
        await navigator.share({ title: place.name, text, url: mapsLink })
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
    <section className="absolute inset-0 z-[1400] flex flex-col bg-white lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[440px] lg:border-l lg:border-slate-200 lg:shadow-2xl">
      <div className="flex-1 overflow-y-auto">
        {/* Cabeçalho visual (a foto do local virá numa fase futura) */}
        <div
          className={`relative flex h-44 items-center justify-center overflow-hidden ${
            place.category === 'pharmacy'
              ? 'bg-gradient-to-br from-emerald-700 to-ink'
              : 'bg-gradient-to-br from-blue-600 to-ink'
          }`}
        >
          <PlaceIcon category={place.category} className="h-28 w-28 bg-white/15" />
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

        <div className="-mt-6 space-y-5 rounded-t-3xl bg-white p-5">
          {/* Identificação */}
          <div className="flex items-start gap-4">
            <PlaceIcon category={place.category} className="-mt-10 h-16 w-16 ring-4 ring-white" />
            <div className="min-w-0 space-y-1.5">
              <h1 className="text-xl font-bold leading-tight text-slate-950">{place.name}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <StatusChip status={status} category={place.category} />
                <Rating avg={place.avg_rating} count={place.review_count} />
              </div>
            </div>
          </div>

          <div className="flex items-start justify-between gap-3 text-sm text-slate-700">
            <span className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-900" />
              {place.address ?? CATEGORY_LABELS[place.category]}
            </span>
            {km !== null && (
              <span className="flex shrink-0 items-center gap-1 text-slate-500">
                <Navigation className="h-3.5 w-3.5" />
                {formatDistance(km)}
              </span>
            )}
          </div>

          {/* Estado actual */}
          <div>
            <h2 className="mb-2 text-sm font-bold text-slate-950">Estado atual</h2>
            <div
              className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 ring-1 ${STATUS_CARD[status].bg}`}
            >
              <div className="flex items-center gap-3">
                <span className={`h-3.5 w-3.5 rounded-full ${DOT[status]}`} />
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
          </div>

          {/* Acções */}
          <div className="grid grid-cols-3 gap-2.5">
            {place.phone ? (
              <a
                href={`tel:${place.phone}`}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 py-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Phone className="h-5 w-5 text-slate-900" />
                Ligar
              </a>
            ) : (
              <span
                title="Telefone não disponível"
                className="flex cursor-not-allowed flex-col items-center gap-1.5 rounded-xl border border-slate-200 py-3 text-xs font-medium text-slate-300"
              >
                <Phone className="h-5 w-5" />
                Ligar
              </span>
            )}
            <a
              href={directionsLink}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 py-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Navigation className="h-5 w-5 text-slate-900" />
              Direções
            </a>
            <button
              type="button"
              onClick={() => setRateOpen((v) => !v)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition ${
                rateOpen
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
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
                  <StarPicker disabled={saving} onRate={rate} />
                </>
              ) : (
                <div className="text-sm text-slate-600">
                  Entra na tua conta (botão no topo) para avaliar este local.
                </div>
              )}
            </div>
          )}

          {/* Últimos reportes */}
          <div>
            <h2 className="mb-2 text-sm font-bold text-slate-950">Últimos reportes</h2>
            {reports.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-4 text-center text-xs text-slate-500 ring-1 ring-slate-200">
                Ainda ninguém reportou o estado deste local. Sê a primeira pessoa!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl ring-1 ring-slate-200">
                {reports.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <span className={`h-3 w-3 shrink-0 rounded-full ${DOT[r.status]}`} />
                    <span className="leading-tight">
                      <span className="block text-sm font-semibold text-slate-900">
                        {statusLabel(r.status, place.category)}
                      </span>
                      <span className="block text-xs text-slate-500">{timeAgo(r.created_at)}</span>
                    </span>
                    <span className="ml-auto flex items-center gap-2 text-xs text-slate-500">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100">
                        <User className="h-4 w-4" />
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

      {/* Barra fixa: reportar o estado em dois toques */}
      <div className="space-y-3 border-t border-slate-200 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {thanks && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
            <Check className="h-5 w-5 shrink-0" />
            {thanks}
          </div>
        )}

        {reportOpen && (
          <div className="space-y-2">
            <div className="text-center text-sm font-semibold text-slate-800">Como está agora?</div>
            {session ? (
              <div className="grid grid-cols-3 gap-2">
                {STATUS_ORDER.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={saving}
                    onClick={() => report(s)}
                    className={`rounded-xl py-3.5 text-sm font-bold text-white transition active:scale-95 disabled:opacity-60 ${REPORT_BTN[s]}`}
                  >
                    {statusLabel(s, place.category)}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-900 ring-1 ring-amber-200">
                Entra na tua conta (botão no topo) para reportar. É rápido e ajuda quem procura este local.
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => setReportOpen((v) => !v)}
          className={`w-full rounded-2xl py-3.5 text-base font-bold transition active:scale-[0.98] ${
            reportOpen ? 'bg-slate-100 text-slate-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {reportOpen ? 'Cancelar' : 'Reportar estado'}
        </button>
      </div>
    </section>
  )
}