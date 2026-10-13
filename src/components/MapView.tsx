import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import type { Session } from '@supabase/supabase-js'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../lib/supabase'
import type { Place, PlaceStatus } from '../types'

const COLORS = { pharmacy: '#059669', fuel: '#f59e0b' }
const LABELS = { pharmacy: 'Farmácia', fuel: 'Bomba de combustível' }

type Filter = 'all' | 'pharmacy' | 'fuel'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'pharmacy', label: 'Farmácias' },
  { id: 'fuel', label: 'Bombas' },
]

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

const STATUS_BUTTONS: { value: PlaceStatus; className: string }[] = [
  { value: 'open', className: 'bg-emerald-600 hover:bg-emerald-700' },
  { value: 'closed', className: 'bg-red-600 hover:bg-red-700' },
  { value: 'out_of_stock', className: 'bg-amber-500 hover:bg-amber-600' },
]

// Move o mapa para a posição do utilizador sempre que ela muda
function FlyToUser({ position }: { position: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.flyTo(position, 15, { duration: 1.2 })
  }, [position, map])
  return null
}

// Quando o modo "adicionar" está activo, um clique no mapa escolhe a posição
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

export default function MapView() {
  const [places, setPlaces] = useState<Place[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [session, setSession] = useState<Session | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [userPos, setUserPos] = useState<[number, number] | null>(null)
  const [locating, setLocating] = useState(false)
  const [geoMessage, setGeoMessage] = useState<string | null>(null)

  // Adicionar novo local
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

  // Uma avaliação por utilizador e local: se já existe, a nota é actualizada
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

  const visiblePlaces = useMemo(
    () => (filter === 'all' ? places : places.filter((p) => p.category === filter)),
    [places, filter]
  )

  return (
    <div className="relative h-full w-full">
      {/* Barra de filtros */}
      <div className="absolute left-1/2 top-3 z-[1000] flex -translate-x-1/2 gap-1 rounded-full bg-white p-1 shadow-lg">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              filter === f.id ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Contador */}
      <div className="absolute right-3 top-3 z-[1000] rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow">
        {error ? 'Erro: ' + error : `${visiblePlaces.length} locais`}
      </div>

      {/* Botão Adicionar local (só com sessão) */}
      {session && !addMode && (
        <button
          type="button"
          onClick={() => setAddMode(true)}
          className="absolute left-3 top-24 z-[1000] rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-emerald-700"
        >
          + Adicionar local
        </button>
      )}

      {/* Instrução enquanto escolhe a posição */}
      {addMode && !newPos && (
        <div className="absolute left-1/2 top-16 z-[1000] flex -translate-x-1/2 items-center gap-3 rounded-full bg-gray-900 px-4 py-2 text-xs text-white shadow-lg">
          <span>Clica no mapa onde fica o local</span>
          <button type="button" onClick={cancelAdd} className="font-semibold text-amber-300 hover:underline">
            Cancelar
          </button>
        </div>
      )}

      {/* Formulário do novo local */}
      {addMode && newPos && (
        <form
          onSubmit={saveNewPlace}
          className="absolute bottom-6 left-1/2 z-[1000] w-72 -translate-x-1/2 space-y-3 rounded-2xl bg-white p-4 shadow-xl"
        >
          <h2 className="text-sm font-bold text-gray-900">Novo local</h2>

          <input
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome do local"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />

          <div className="flex gap-1">
            {(['pharmacy', 'fuel'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewCategory(c)}
                className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold ${
                  newCategory === c
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {LABELS[c]}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={cancelAdd}
              className="flex-1 rounded-lg border border-gray-200 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingId === 'new'}
              className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {savingId === 'new' ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </form>
      )}

      {/* Botão Perto de mim */}
      <div className="absolute bottom-8 right-3 z-[1000] flex flex-col items-end gap-2">
        {geoMessage && (
          <div className="max-w-[220px] rounded-lg bg-white px-3 py-2 text-xs text-red-600 shadow-lg">
            {geoMessage}
          </div>
        )}
        <button
          type="button"
          onClick={locateMe}
          disabled={locating}
          className="rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {locating ? 'A localizar...' : 'Perto de mim'}
        </button>
      </div>

      {/* Legenda */}
      <div className="absolute bottom-6 left-3 z-[1000] space-y-1.5 rounded-xl bg-white px-3 py-2.5 text-xs shadow-lg">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.pharmacy }} />
          <span>Farmácia</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.fuel }} />
          <span>Bomba de combustível</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#2563eb' }} />
          <span>A tua posição</span>
        </div>
      </div>

      <MapContainer center={[-8.839, 13.289]} zoom={13} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FlyToUser position={userPos} />
        <ClickToPlace active={addMode} onPick={setNewPos} />

        {userPos && (
          <CircleMarker
            center={userPos}
            radius={9}
            pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }}
          >
            <Popup>Estás aqui</Popup>
          </CircleMarker>
        )}

        {/* Posição escolhida para o novo local */}
        {newPos && (
          <CircleMarker
            center={newPos}
            radius={10}
            pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#7c3aed', fillOpacity: 1 }}
          />
        )}

        {visiblePlaces.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={7}
            pathOptions={{
              color: '#ffffff',
              weight: 2,
              fillColor: COLORS[p.category],
              fillOpacity: 1,
            }}
          >
            <Popup autoPanPaddingTopLeft={[20, 90]}>
              <div className="min-w-[200px] space-y-1.5">
                <strong>{p.name}</strong>
                <div>{LABELS[p.category]}</div>
                {p.address && <div>{p.address}</div>}

                {/* Estado actual */}
                <div className="border-t border-gray-200 pt-1.5 text-xs">
                  {p.current_status && p.status_updated_at ? (
                    <span>
                      <strong>{statusLabel(p.current_status, p.category)}</strong> ·{' '}
                      {timeAgo(p.status_updated_at)}
                    </span>
                  ) : (
                    <span className="text-gray-500">Ainda sem informação de estado</span>
                  )}
                </div>

                {/* Média de avaliações */}
                <div className="text-xs">
                  {p.review_count ? (
                    <span>
                      <strong className="text-amber-500">★ {Number(p.avg_rating).toFixed(1)}</strong>{' '}
                      ({p.review_count} {p.review_count === 1 ? 'avaliação' : 'avaliações'})
                    </span>
                  ) : (
                    <span className="text-gray-500">Ainda sem avaliações</span>
                  )}
                </div>

                {session ? (
                  <div className="space-y-1.5">
                    {/* Reportar estado */}
                    <div>
                      <div className="text-xs text-gray-500">Como está agora?</div>
                      <div className="mt-1 flex gap-1">
                        {STATUS_BUTTONS.map((b) => (
                          <button
                            key={b.value}
                            type="button"
                            disabled={savingId === p.id}
                            onClick={() => reportStatus(p.id, b.value)}
                            className={`flex-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-white disabled:opacity-60 ${b.className}`}
                          >
                            {statusLabel(b.value, p.category)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Avaliar com estrelas */}
                    <div className="flex items-center gap-0.5">
                      <span className="mr-1 text-xs text-gray-500">Avaliar:</span>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          disabled={savingId === p.id}
                          onClick={() => rate(p.id, n)}
                          aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}
                          className="text-xl leading-none text-amber-400 hover:scale-125 disabled:opacity-60"
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">Entra para reportar o estado e avaliar.</div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}