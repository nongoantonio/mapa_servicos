import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../lib/supabase'
import type { Place } from '../types'

const COLORS = { pharmacy: '#059669', fuel: '#f59e0b' }
const LABELS = { pharmacy: 'Farmácia', fuel: 'Bomba de combustível' }

export default function MapView() {
  const [places, setPlaces] = useState<Place[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('places_with_status')
      .select('*')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setPlaces(data as Place[])
      })
  }, [])

  return (
    <div className="relative h-full w-full">
      <div className="absolute right-3 top-3 z-[1000] rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow">
        {error ? 'Erro: ' + error : `${places.length} locais`}
      </div>

      <MapContainer center={[-8.839, 13.289]} zoom={13} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {places.map((p) => (
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