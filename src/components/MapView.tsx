import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { divIcon } from 'leaflet'
import type { Session } from '@supabase/supabase-js'
import { Clock, Droplet, LocateFixed, MapPin, Plus, Star } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../lib/supabase'
import type { Place, PlaceStatus } from '../types'
import AuthPanel from './AuthPanel'

const LABELS = { pharmacy: 'Farmácia', fuel: 'Bomba de combustível' } as const

type Filter = 'all' | 'pharmacy' | 'fuel'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'pharmacy', label: 'Farmácias' },
  { id: 'fuel', label: 'Bombas' },
]

const STATUS_ORDER: PlaceStatus[] = ['open', 'closed', 'out_of_stock']

// Aberto = azul claro · Fechado = preto · Sem stock = cinzento
const STATUS_STYLES: Record<PlaceStatus, { badge: string; dot: string; button: string }> = {
  open: {
    badge: 'bg-sky-100 text-sky-800 ring-sky-200',
    dot: 'bg-sky-500',
    button: 'border-sky-300 text-sky-800 hover:bg-sky-50',
  },
  closed: {
    badge: 'bg-slate-950 text-white ring-slate-950',
    dot: 'bg-white',
    button: 'border-slate-900 text-slate-950 hover:bg-slate-100',
  },
  out_of_stock: {
    badge: 'bg-slate-200 text-slate-700 ring-slate-300',
    dot: 'bg-slate-500',
    button: 'border-slate-300 text-slate-600 hover:bg-slate-100',
  },
}

function statusLabel(status: PlaceStatus, category: Place['category']) {
  if (status === 'open') return 'Aberto'
  if (status === 'closed') return 'Fechado'
  return category === 'fuel' ? 'Sem combustível' : 'Sem stock'
}

function timeAgo(iso: string) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'agora mesmo'
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours} h`
  return `há ${Math.floor(hours / 24)} d`
}

/* ── Ícones dos marcadores ── */
const svg = (inner: string) =>
  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`

const PLUS = '<path d="M5 12h14"/><path d="M12 5v14"/>'
const DROP =
  '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>'

const makePin = (kind: 'pharmacy' | 'fuel' | 'new', inner: string) =>
  divIcon({
    className: '',
    html: `<div class="pin pin-${kind}">${svg(inner)}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  })

const ICONS = {
  pharmacy: makePin('pharmacy', PLUS),
  fuel: makePin('fuel', DROP),
  added: makePin('new', PLUS),
}

const USER_ICON = divIcon({
  className: '',
  html: '<div class="user-dot"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

/* ── Auxiliares do mapa ── */
function FlyToUser({ position }: { position: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.flyTo(position, 15, { duration: 1.2 })
  }, [position, map])
  return null
}

function ClickToPlace({
  active,
  onPick,
}: {
  active: boolean
  onPick: (pos: [number, number]) => void
}) {
  useMapEvents({
    click(e) {
      if (active) onPick([e.latlng.lat, e.latlng.lng])
    },
  })
  return null
}

/* ── Estrelas que se enchem ao passar o rato ── */
function StarRating({ disabled, onRate }: { disabled: boolean; onRate: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onMouseEnter={() => setHover(n)}
          onClick={() => onRate(n)}
          aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}
          className="p-0.5 disabled:opacity-60"
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              n <= hover ? 'fill-sky-400 text-sky-400' : 'text-slate-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

/* ── Conteúdo do balão de um local ── */
function PlacePopupContent({
  place,
  session,
  saving,
  onStatus,
  onRate,
}: {
  place: Place
  session: Session | null
  saving: boolean
  onStatus: (s: PlaceStatus) => void
  onRate: (n: number) => void
}) {
  const isPharmacy = place.category === 'pharmacy'

  return (
    <div className="w-[260px] p-4">
      <div className="flex items-start gap-3 pr-5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isPharmacy ? 'bg-navy text-white' : 'bg-sky-400 text-navy'
          }`}
        >
          {isPharmacy ? <Plus className="h-5 w-5" strokeWidth={3} /> : <Droplet className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold leading-snug text-slate-950">{place.name}</h3>
          <div className="text-xs text-slate-500">{LABELS[place.category]}</div>
        </div>
      </div>

      {place.address && (
        <div className="mt-2.5 flex items-start gap-1.5 text-xs text-slate-600">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span>{place.address}</span>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {place.current_status && place.status_updated_at ? (
          <>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                STATUS_STYLES[place.current_status].badge
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_STYLES[place.current_status].dot}`} />
              {statusLabel(place.current_status, place.category)}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="h-3 w-3" />
              {timeAgo(place.status_updated_at)}
            </span>
          </>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
            Sem informação de estado
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-600">
        <Star
          className={`h-4 w-4 ${place.review_count ? 'fill-sky-400 text-sky-400' : 'text-slate-300'}`}
        />
        {place.review_count ? (
          <span>
            <strong className="text-slate-950">{Number(place.avg_rating).toFixed(1)}</strong> ·{' '}
            {place.review_count} {place.review_count === 1 ? 'avaliação' : 'avaliações'}
          </span>
        ) : (
          <span className="text-slate-400">Ainda sem avaliações</span>
        )}
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3">
        {session ? (
          <div className="space-y-3">
            <div>
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Como está agora?
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {STATUS_ORDER.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={saving}
                    onClick={() => onStatus(s)}
                    className={`rounded-lg border px-1 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-60 ${STATUS_STYLES[s].button}`}
                  >
                    {statusLabel(s, place.category)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Avaliar
              </span>
              <StarRating disabled={saving} onRate={onRate} />
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500">
            Entra para reportar o estado e avaliar este local.
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Componente principal ── */
export default function MapView() {
  const [places, setPlaces] = useState<Place[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [session, setSession] = useState<Session | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [userPos, setUserPos] = useState<[number, number] | null>(null)
  const [locating, setLocating] = useState(false)
  const [geoMessage, setGeoMessage] = useState<string | null>(null)

  const [addMode, setAddMode] = useState(false)
  const [newPos, setNewPos] = useState<[number, number] | null>(null)
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState<Place['category']>('pharmacy')

  const loadPlaces = useCallback(async () => {
    const { data, error } = await supabase.from('places_with_status').select('*')
    if (error) setError(error.message)
    else setPlaces(data as Place[])
  }, [])

  useEffect(() => {
    loadPlaces()
  }, [loadPlaces])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  async function reportStatus(placeId: string, status: PlaceStatus) {
    if (!session) return
    setSavingId(placeId)
    const { error } = await supabase
      .from('status_reports')
      .insert({ place_id: placeId, user_id: session.user.id, status })
    setSavingId(null)

    if (error) {
      setError(error.message)
    } else {
      setError(null)
      await loadPlaces()
    }
  }

  async function rate(placeId: string, rating: number) {
    if (!session) return
    setSavingId(placeId)
    const { error } = await supabase
      .from('reviews')
      .upsert(
        { place_id: placeId, user_id: session.user.id, rating },
        { onConflict: 'place_id,user_id' }
      )
    setSavingId(null)

    if (error) {
      setError(error.message)
    } else {
      setError(null)
      await loadPlaces()
    }
  }

  function cancelAdd() {
    setAddMode(false)
    setNewPos(null)
    setNewName('')
  }

  async function saveNewPlace(e: React.FormEvent) {
    e.preventDefault()
    if (!session || !newPos || newName.trim().length < 2) return

    setSavingId('new')
    const [lat, lng] = newPos
    const { error } = await supabase.from('places').insert({
      name: newName.trim(),
      category: newCategory,
      location: `SRID=4326;POINT(${lng} ${lat})`,
      created_by: session.user.id,
    })
    setSavingId(null)

    if (error) {
      setError(error.message)
    } else {
      setError(null)
      cancelAdd()
      await loadPlaces()
    }
  }

  function locateMe() {
    if (!navigator.geolocation) {
      setGeoMessage('O teu browser não suporta localização.')
      return
    }
    setLocating(true)
    setGeoMessage(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude])
        setLocating(false)
      },
      () => {
        setGeoMessage('Não foi possível obter a tua localização. Verifica a permissão do browser.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const counts = useMemo(
    () => ({
      all: places.length,
      pharmacy: places.filter((p) => p.category === 'pharmacy').length,
      fuel: places.filter((p) => p.category === 'fuel').length,
    }),
    [places]
  )

  const visiblePlaces = useMemo(
    () => (filter === 'all' ? places : places.filter((p) => p.category === filter)),
    [places, filter]
  )

  return (
    <div className={`relative h-full w-full ${addMode ? 'adding' : ''}`}>
      {/* Cabeçalho */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex flex-wrap items-start justify-between gap-2 p-3">
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-2xl bg-navy px-3 py-2 text-white shadow-lg">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400 text-navy">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold">Mapa de Serviços</div>
            <div className="text-[11px] text-sky-200">Luanda · actualizado pela comunidade</div>
          </div>
        </div>

        <div className="pointer-events-auto order-3 flex w-full gap-1 overflow-x-auto rounded-2xl bg-white p-1 shadow-lg ring-1 ring-slate-200 sm:order-none sm:w-auto">
          {FILTERS.map((f) => {
            const active = filter === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                  active ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f.label}
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {counts[f.id]}
                </span>
              </button>
            )
          })}
        </div>

        <div className="pointer-events-auto">
          <AuthPanel />
        </div>
      </header>

      {/* Botões flutuantes */}
      {!addMode && (
        <div className="absolute bottom-32 right-3 z-[1000] flex flex-col items-end gap-2.5">
          {geoMessage && (
            <div className="max-w-[230px] rounded-xl bg-white px-3 py-2 text-xs text-slate-700 shadow-lg ring-1 ring-slate-200">
              {geoMessage}
            </div>
          )}

          {session && (
            <button
              type="button"
              onClick={() => setAddMode(true)}
              className="flex items-center gap-2 rounded-full bg-navy px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-navy-dark active:scale-95"
            >
              <Plus className="h-4 w-4 text-sky-400" strokeWidth={3} />
              Adicionar local
            </button>
          )}

          <button
            type="button"
            onClick={locateMe}
            disabled={locating}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-navy shadow-lg ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-95 disabled:opacity-60"
          >
            <LocateFixed className={`h-4 w-4 text-sky-500 ${locating ? 'animate-spin' : ''}`} />
            {locating ? 'A localizar…' : 'Perto de mim'}
          </button>
        </div>
      )}

      {/* Legenda (escondida em ecrãs pequenos) */}
      <div className="absolute bottom-6 left-3 z-[1000] hidden space-y-2 rounded-2xl bg-white px-3.5 py-3 text-xs text-slate-700 shadow-lg ring-1 ring-slate-200 sm:block">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-navy" />
          Farmácia
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-sky-400" />
          Bomba de combustível
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-950" />A tua posição
        </div>
      </div>

      {/* Zona inferior central: erros, instrução e formulário */}
      <div className="pointer-events-none absolute bottom-6 left-1/2 z-[1000] flex w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 flex-col items-center gap-2">
        {error && (
          <div className="pointer-events-auto flex w-full items-start justify-between gap-3 rounded-xl bg-slate-950 px-3 py-2 text-xs font-medium text-white shadow-lg">
            <span>
              <strong className="text-sky-400">Erro:</strong> {error}
            </span>
            <button type="button" onClick={() => setError(null)} className="font-bold text-sky-300 underline">
              Fechar
            </button>
          </div>
        )}

        {addMode && !newPos && (
          <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-slate-950 px-4 py-2.5 text-xs text-white shadow-lg">
            <MapPin className="h-4 w-4 text-sky-400" />
            <span>Toca no mapa onde fica o local</span>
            <button type="button" onClick={cancelAdd} className="font-semibold text-sky-300 hover:underline">
              Cancelar
            </button>
          </div>
        )}

        {addMode && newPos && (
          <form
            onSubmit={saveNewPlace}
            className="pointer-events-auto w-full space-y-3 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200"
          >
            <h2 className="text-sm font-bold text-slate-950">Novo local</h2>

            <input
              type="text"
              required
              minLength={2}
              maxLength={80}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome do local"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
            />

            <div className="flex gap-2">
              {(['pharmacy', 'fuel'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewCategory(c)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-semibold transition-colors ${
                    newCategory === c
                      ? 'border-navy bg-sky-50 text-navy'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {c === 'pharmacy' ? (
                    <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                  ) : (
                    <Droplet className="h-3.5 w-3.5" />
                  )}
                  {LABELS[c]}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelAdd}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingId === 'new'}
                className="flex-1 rounded-xl bg-navy py-2.5 text-xs font-bold text-white transition hover:bg-navy-dark disabled:opacity-60"
              >
                {savingId === 'new' ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>

      <MapContainer
        center={[-8.839, 13.289]}
        zoom={13}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />

        <FlyToUser position={userPos} />
        <ClickToPlace active={addMode} onPick={setNewPos} />

        {userPos && <Marker position={userPos} icon={USER_ICON} />}
        {newPos && <Marker position={newPos} icon={ICONS.added} />}

        {visiblePlaces.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={ICONS[p.category]}>
            <Popup autoPanPaddingTopLeft={[20, 130]}>
              <PlacePopupContent
                place={p}
                session={session}
                saving={savingId === p.id}
                onStatus={(s) => reportStatus(p.id, s)}
                onRate={(n) => rate(p.id, n)}
              />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}