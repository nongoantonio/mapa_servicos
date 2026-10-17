import { useEffect, useMemo, useState } from 'react'
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { divIcon, latLngBounds, type DivIcon } from 'leaflet'
import type { Session } from '@supabase/supabase-js'
import { Fuel, LocateFixed, MapPin, Maximize2, Plus } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css'
import { supabase } from '../lib/supabase'
import type { Place } from '../types'
import {
  CATEGORY_LABELS,
  STATUS_COLORS,
  distanceKm,
  formatDistance,
  statusLabel,
  type StatusKey,
} from '../lib/utils'

/* ── Ícones dos marcadores: cor = estado, símbolo = tipo de local ── */
const svg = (inner: string) =>
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`

const PLUS = '<path d="M5 12h14"/><path d="M12 5v14"/>'
const PUMP =
  '<path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0v-6.998a2 2 0 0 0-.59-1.42L18 5"/><path d="M14 21V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16"/><path d="M2 21h13"/><path d="M3 9h11"/>'

const iconCache = new Map<string, DivIcon>()

function pinIcon(category: Place['category'], status: StatusKey | 'new', selected: boolean) {
  const key = `${category}-${status}-${selected}`
  let icon = iconCache.get(key)
  if (!icon) {
    icon = divIcon({
      className: '',
      html: `<div class="pin pin-${status}${selected ? ' pin-selected' : ''}">${svg(
        category === 'fuel' ? PUMP : PLUS
      )}</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
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

// Círculo com o número de locais agrupados
function clusterIcon(cluster: { getChildCount: () => number }) {
  const count = cluster.getChildCount()
  const size = count < 10 ? 42 : count < 50 ? 50 : 58
  return divIcon({
    html: `<div class="cluster" style="width:${size}px;height:${size}px">${count}</div>`,
    className: '',
    iconSize: [size, size],
  })
}

/* ── Auxiliares do mapa ── */

// Decide para onde o mapa olha:
//  - local seleccionado: mostra-o junto com a tua posição (e a linha entre os dois)
//  - sem seleção mas com localização: mostra-te a ti e os 3 locais mais próximos
function AutoFocus({
  user,
  selected,
  nearest,
}: {
  user: [number, number] | null
  selected: Place | undefined
  nearest: Place[]
}) {
  const map = useMap()
  useEffect(() => {
    const options = {
      paddingTopLeft: [60, 70] as [number, number],
      // deixa espaço por baixo para o cartão do local
      paddingBottomRight: [60, selected ? 250 : 60] as [number, number],
      maxZoom: 16,
      duration: 0.9,
    }
    if (selected) {
      const points: [number, number][] = [[selected.lat, selected.lng]]
      if (user) points.push(user)
      if (points.length === 1) map.flyTo(points[0], Math.max(map.getZoom(), 16), { duration: 0.9 })
      else map.flyToBounds(latLngBounds(points), options)
    } else if (user) {
      const points: [number, number][] = [user, ...nearest.map((p) => [p.lat, p.lng] as [number, number])]
      map.flyToBounds(latLngBounds(points), { ...options, maxZoom: 15 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, user?.[0], user?.[1]])
  return null
}

// Botão "ver tudo": enquadra todos os locais visíveis
function FitAll({ places, signal }: { places: Place[]; signal: number }) {
  const map = useMap()
  useEffect(() => {
    if (signal === 0 || places.length === 0) return
    map.flyToBounds(
      latLngBounds(places.map((p) => [p.lat, p.lng] as [number, number])),
      { padding: [60, 60], duration: 0.9 }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal])
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

const LEGEND = [
  { color: STATUS_COLORS.open, label: 'Aberto' },
  { color: STATUS_COLORS.closed, label: 'Fechado' },
  { color: STATUS_COLORS.out_of_stock, label: 'Sem stock' },
  { color: STATUS_COLORS.none, label: 'Sem informação' },
]

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
  onlyOpen,
  onToggleOpen,
  live,
  cardOpen,
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
  onlyOpen: boolean
  onToggleOpen: () => void
  live: boolean
  cardOpen: boolean
}) {
  const [locating, setLocating] = useState(false)
  const [geoMessage, setGeoMessage] = useState<string | null>(null)
  const [fitSignal, setFitSignal] = useState(0)

  const [addMode, setAddMode] = useState(false)
  const [newPos, setNewPos] = useState<[number, number] | null>(null)
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState<Place['category']>('pharmacy')
  const [saving, setSaving] = useState(false)

  // Os 3 locais mais próximos de ti (para o enquadramento inicial)
  const nearest = useMemo(() => {
    if (!userPos) return []
    return [...places]
      .map((p) => ({ p, km: distanceKm(userPos, [p.lat, p.lng]) }))
      .sort((a, b) => a.km - b.km)
      .slice(0, 3)
      .map((x) => x.p)
  }, [places, userPos])

  // O local seleccionado fica fora do agrupamento, para estar sempre visível
  const clusterPlaces = useMemo(
    () => places.filter((p) => p.id !== selectedPlace?.id),
    [places, selectedPlace?.id]
  )

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

  function renderPlace(p: Place, selected: boolean) {
    const status: StatusKey = p.current_status ?? 'none'
    return (
      <Marker
        key={p.id}
        position={[p.lat, p.lng]}
        icon={pinIcon(p.category, status, selected)}
        zIndexOffset={selected ? 1000 : 0}
        eventHandlers={{ click: () => !addMode && onSelect(p.id) }}
      >
        {/* Ao passar o rato: nome e estado */}
        <Tooltip direction="top" offset={[0, -20]} opacity={1}>
          <strong>{p.name}</strong> · {statusLabel(status, p.category)}
        </Tooltip>
      </Marker>
    )
  }

  return (
    <div className={`relative h-full w-full ${addMode ? 'adding' : ''}`}>
      {/* Botões à esquerda: localização e ver tudo */}
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
        <button
          type="button"
          onClick={() => setFitSignal((n) => n + 1)}
          title="Ver todos os locais"
          aria-label="Ver todos os locais"
          className={mapBtn}
        >
          <Maximize2 className="h-5 w-5" />
        </button>
        {geoMessage && (
          <div className="w-52 rounded-xl bg-white px-3 py-2 text-xs text-slate-700 shadow-lg ring-1 ring-slate-200">
            {geoMessage}
          </div>
        )}
      </div>

      {/* Barra no topo: só abertas + número de locais + ao vivo */}
      <div className="absolute left-1/2 top-3 z-[1000] flex -translate-x-1/2 items-center gap-2">
        <button
          type="button"
          onClick={onToggleOpen}
          className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold shadow-lg ring-1 transition active:scale-95 ${
            onlyOpen
              ? 'bg-emerald-600 text-white ring-emerald-600'
              : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${onlyOpen ? 'bg-white' : 'bg-emerald-500'}`} />
          Só abertas agora
        </button>
        <span className="hidden rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-lg ring-1 ring-slate-200 sm:block">
          {places.length} {places.length === 1 ? 'local' : 'locais'}
        </span>
        {live && (
          <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-semibold text-emerald-700 shadow-lg ring-1 ring-slate-200">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Ao vivo
          </span>
        )}
      </div>

      {/* Erro */}
      {error && (
        <div className="absolute left-1/2 top-16 z-[1000] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-start justify-between gap-3 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-medium text-white shadow-lg">
          <span>
            <strong className="text-emerald-400">Erro:</strong> {error}
          </span>
          <button type="button" onClick={() => onError(null)} className="font-bold text-emerald-300 underline">
            Fechar
          </button>
        </div>
      )}

      {/* Coluna da direita: adicionar local + legenda */}
      <div
        className={`absolute right-3 z-[1000] flex flex-col items-end gap-3 lg:bottom-10 lg:right-4 ${
          cardOpen ? 'bottom-64' : 'bottom-6'
        }`}
      >
        {session && !addMode && (
          <button
            type="button"
            onClick={() => setAddMode(true)}
            className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700 active:scale-95"
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
            Adicionar local
          </button>
        )}
        <div className="hidden space-y-2 rounded-2xl bg-white px-4 py-3 text-xs text-slate-700 shadow-lg ring-1 ring-slate-200 lg:block">
          {LEGEND.map((l) => (
            <div key={l.label} className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Instrução e formulário de novo local */}
      <div className="pointer-events-none absolute bottom-6 left-1/2 z-[1100] flex w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 flex-col items-center gap-2">
        {addMode && !newPos && (
          <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-slate-950 px-4 py-2.5 text-xs text-white shadow-lg">
            <MapPin className="h-4 w-4 text-emerald-400" />
            <span>Toca no mapa onde fica o local</span>
            <button type="button" onClick={cancelAdd} className="font-semibold text-emerald-300 hover:underline">
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />

            <div className="flex gap-2">
              {(['pharmacy', 'fuel'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewCategory(c)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-semibold transition-colors ${
                    newCategory === c
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {c === 'pharmacy' ? (
                    <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                  ) : (
                    <Fuel className="h-3.5 w-3.5" />
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
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
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

        <AutoFocus user={userPos} selected={selectedPlace} nearest={nearest} />
        <FitAll places={places} signal={fitSignal} />
        <ClickToPlace active={addMode} onPick={setNewPos} />

        {userPos && <Marker position={userPos} icon={USER_ICON} />}
        {newPos && <Marker position={newPos} icon={pinIcon('pharmacy', 'new', false)} />}

        {/* Linha tracejada de ti até ao local escolhido, com a distância */}
        {userPos && selectedPlace && (
          <Polyline
            positions={[userPos, [selectedPlace.lat, selectedPlace.lng]]}
            pathOptions={{ color: '#059669', weight: 3, dashArray: '6 9', opacity: 0.9 }}
          >
            <Tooltip permanent direction="center" className="distance-tip" opacity={1}>
              {formatDistance(distanceKm(userPos, [selectedPlace.lat, selectedPlace.lng]))}
            </Tooltip>
          </Polyline>
        )}

        {/* Locais agrupados em círculos com número */}
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={55}
          showCoverageOnHover={false}
          spiderfyOnMaxZoom
          disableClusteringAtZoom={17}
          iconCreateFunction={clusterIcon}
        >
          {clusterPlaces.map((p) => renderPlace(p, false))}
        </MarkerClusterGroup>

        {selectedPlace && renderPlace(selectedPlace, true)}
      </MapContainer>
    </div>
  )
}