import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../lib/supabase'
import type { Place } from '../types'

const COLORS = { pharmacy: '#059669', fuel: '#f59e0b' }
const LABELS = { pharmacy: 'Farmácia', fuel: 'Bomba de combustível' }

type Filter = 'all' | 'pharmacy' | 'fuel'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'pharmacy', label: 'Farmácias' },
  { id: 'fuel', label: 'Bombas' },
]

export default function MapView() {
  const [places, setPlaces] = useState<Place[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    supabase
      .from('places_with_status')
      .select('*')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setPlaces(data as Place[])
      })
  }, [])

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
              filter === f.id
                ? 'bg-emerald-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
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
      </div>

      <MapContainer center={[-8.839, 13.289]} zoom={13} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

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
            <Popup>
              <strong>{p.name}</strong>
              <br />
              {LABELS[p.category]}
              {p.address && (
                <>
                  <br />
                  {p.address}
                </>
              )}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}