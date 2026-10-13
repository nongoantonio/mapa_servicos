import { useEffect, useState } from 'react'
import {
  MapContainer,
  Marker,
  Popup,
  ScaleControl,
  TileLayer,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { divIcon, type DivIcon } from 'leaflet'
import type { Session } from '@supabase/supabase-js'
import { ChevronRight, Droplet, LocateFixed, MapPin, Plus } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../lib/supabase'
import type { Place } from '../types'
import { CATEGORY_LABELS, STATUS_COLORS, type StatusKey } from '../lib/utils'

/* ── Ícones dos marcadores: cor = estado, símbolo = tipo de local ── */
const svg = (inner: string) =>
  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`

const PLUS = '<path d="M5 12h14"/><path d="M12 5v14"/>'
const DROP =
  '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>'

const iconCache = new Map<string, DivIcon>()

function pinIcon(category: Place['category'] | 'new', status: StatusKey | 'new', selected: boolean) {
  const key = `${category}-${status}-${selected}`
  let icon = iconCache.get(key)
  if (!icon) {
    icon = divIcon({
      className: '',
      html: `<div class="pin pin-${status}${selected ? ' pin-selected' : ''}">${svg(
        category === 'fuel' ? DROP : PLUS
      )}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18],
    })
    iconCache.set(key, icon)
  }
  return icon
}

const USER_ICON = divIcon({
  className: '',
  html: '<div class="user-dot"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

/* ── Auxiliares do mapa ── */
function FlyTo({ target, zoom }: { target: [number, number] | null; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo(target, Math.max(map.getZoom(), zoom), { duration: 0.9 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.[0], target?.[1]])
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

const mapBtn =
  'flex h-10 w-10 items-center justify-center rounded-xl bg-white text-navy shadow-[0_4px_14px_rgba(2,6,23,0.18)] transition hover:bg-slate-50 active:scale-95 disabled:opacity-60'

export default function MapArea({
  places,
  selectedPlace,
  onSelect,
  session,
  onReload,
  userPos,
  onUserPos,
  error,
  onError,
}: {
  places: Place[]
  selectedPlace: Place | undefined
  onSelect: (id: string) => void
  session: Session | null
  onReload: () => Promise<void>
  userPos: [number, number] | null
  onUserPos: (pos: [number, number]) => void
  error: string | null
  onError: (message: string | null) => void
}) {
  const [locating, setLocating] = useState(false)
  const [geoMessage, setGeoMessage] = useState<string | null>(null)

  const [addMode, setAddMode] = useState(false)
  const [newPos, setNewPos] = useState<[number, number] | null>(null)
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState<Place['category']>('pharmacy')
  const [saving, setSaving] = useState(false)

  function cancelAdd() {
    setAddMode(false)
    setNewPos(null)
    setNewName('')
  }

  async function saveNewPlace(e: React.FormEvent) {
    e.preventDefault()
    if (!session || !newPos || newName.trim().length < 2) return

    setSaving(true)
    const [lat, lng] = newPos
    const { error } = await supabase.from('places').insert({
      name: newName.trim(),
      category: newCategory,
      location: `SRID=4326;POINT(${lng} ${lat})`,
      created_by: session.user.id,
    })
    setSaving(false)

    if (error) {
      onError(error.message)
    } else {
      onError(null)
      cancelAdd()
      await onReload()
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
        onUserPos([pos.coords.latitude, pos.coords.longitude])
        setLocating(false)
      },
      () => {
        setGeoMessage('Não foi possível obter a tua localização. Verifica a permissão do browser.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className={`relative h-full w-full ${addMode ? 'adding' : ''}`}>
      {/* Botão Perto de mim (por baixo dos botões de zoom) */}
      <div className="absolute left-[10px] top-[100px] z-[1000] flex flex-col gap-2">
        <button
          type="button"
          onClick={locateMe}
          disabled={locating}
          title="Perto de mim"
          aria-label="Perto de mim"
          className={mapBtn}
        >
          <LocateFixed className={`h-5 w-5 ${locating ? 'animate-spin' : ''}`} />
        </button>
        {geoMessage && (
          <div className="w-52 rounded-xl bg-white px-3 py-2 text-xs text-slate-700 shadow-lg ring-1 ring-slate-200">
            {geoMessage}
          </div>
        )}
      </div>

      {/* Erro */}
      {error && (
        <div className="absolute left-1/2 top-4 z-[1000] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-start justify-between gap-3 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-medium text-white shadow-lg">
          <span>
            <strong className="text-sky-400">Erro:</strong> {error}
          </span>
          <button type="button" onClick={() => onError(null)} className="font-bold text-sky-300 underline">
            Fechar
          </button>
        </div>
      )}

      {/* Barra de tipos (canto inferior esquerdo) */}
      <div className="absolute bottom-12 left-4 z-[1000] hidden items-center gap-5 rounded-2xl bg-white px-4 py-3 text-xs font-medium text-slate-700 shadow-lg sm:flex">
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Plus className="h-4 w-4" strokeWidth={3.5} />
          </span>
          Farmácias
        </span>
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white">
            <Droplet className="h-4 w-4" />
          </span>
          Bombas
        </span>
      </div>

      {/* Adicionar local */}
      {session && !addMode && (
        <button
          type="button"
          onClick={() => setAddMode(true)}
          className="absolute bottom-10 right-4 z-[1000] flex items-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-blue-700 active:scale-95"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
          Adicionar local
        </button>
      )}

      {/* Instrução e formulário de novo local */}
      <div className="pointer-events-none absolute bottom-10 left-1/2 z-[1000] flex w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 flex-col items-center gap-2">
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />

            <div className="flex gap-2">
              {(['pharmacy', 'fuel'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewCategory(c)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-semibold transition-colors ${
                    newCategory === c
                      ? 'border-brand bg-blue-50 text-brand'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {c === 'pharmacy' ? (
                    <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                  ) : (
                    <Droplet className="h-3.5 w-3.5" />
                  )}
                  {CATEGORY_LABELS[c]}
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
                disabled={saving}
                className="flex-1 rounded-xl bg-brand py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>

      <MapContainer center={[-8.839, 13.289]} zoom={13} zoomControl={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="topleft" />
        <ScaleControl position="bottomleft" imperial={false} />

        <FlyTo target={userPos} zoom={15} />
        <FlyTo target={selectedPlace ? [selectedPlace.lat, selectedPlace.lng] : null} zoom={15} />
        <ClickToPlace active={addMode} onPick={setNewPos} />

        {userPos && <Marker position={userPos} icon={USER_ICON} />}
        {newPos && <Marker position={newPos} icon={pinIcon('pharmacy', 'new', false)} />}

        {places.map((p) => {
          const status: StatusKey = p.current_status ?? 'none'
          const selected = p.id === selectedPlace?.id
          return (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={pinIcon(p.category, status, selected)}
              zIndexOffset={selected ? 1000 : 0}
              eventHandlers={{ click: () => onSelect(p.id) }}
            >
              <Popup autoPanPaddingTopLeft={[60, 60]}>
                <div className="flex w-[260px] items-center gap-3 p-3.5 pr-9">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: STATUS_COLORS[status] }}
                  >
                    {p.category === 'pharmacy' ? (
                      <Plus className="h-6 w-6" strokeWidth={3.5} />
                    ) : (
                      <Droplet className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-slate-950">{p.name}</div>
                    <div className="text-xs text-slate-500">{CATEGORY_LABELS[p.category]}</div>
                    <div className="truncate text-xs text-slate-500">{p.address ?? 'Morada não disponível'}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
