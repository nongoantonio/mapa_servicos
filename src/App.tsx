import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import type { Place, PlaceStatus, StatusReport } from './types'
import Header, { type Filter } from './components/Header'
import Sidebar from './components/Sidebar'
import MapArea from './components/MapArea'
import DetailPanel from './components/DetailPanel'
import Welcome from './components/Welcome'
import ResultsList from './components/ResultsList'

export default function App() {
  const [places, setPlaces] = useState<Place[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [session, setSession] = useState<Session | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [userPos, setUserPos] = useState<[number, number] | null>(null)
  const [reports, setReports] = useState<StatusReport[]>([])
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<'welcome' | 'list' | 'map'>('welcome')
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const loadPlaces = useCallback(async () => {
    const { data, error } = await supabase.from('places_with_status').select('*')
    if (error) setError(error.message)
    else setPlaces(data as Place[])
  }, [])

  const loadReports = useCallback(async (placeId: string) => {
    const { data, error } = await supabase
      .from('status_reports')
      .select('id, status, created_at')
      .eq('place_id', placeId)
      .order('created_at', { ascending: false })
      .limit(5)
    if (error) setError(error.message)
    else setReports(data as StatusReport[])
  }, [])

  useEffect(() => {
    loadPlaces()
  }, [loadPlaces])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // Sempre que o local seleccionado muda, vai buscar os últimos reportes
  useEffect(() => {
    if (selectedId) loadReports(selectedId)
    else setReports([])
  }, [selectedId, loadReports])

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

  const selectedPlace = useMemo(
    () => places.find((p) => p.id === selectedId),
    [places, selectedId]
  )

  async function reportStatus(status: PlaceStatus) {
    if (!session || !selectedId) return
    setSaving(true)
    const { error } = await supabase
      .from('status_reports')
      .insert({ place_id: selectedId, user_id: session.user.id, status })
    setSaving(false)

    if (error) {
      setError(error.message)
    } else {
      setError(null)
      await Promise.all([loadPlaces(), loadReports(selectedId)])
    }
  }

  async function rate(rating: number) {
    if (!session || !selectedId) return
    setSaving(true)
    const { error } = await supabase
      .from('reviews')
      .upsert(
        { place_id: selectedId, user_id: session.user.id, rating },
        { onConflict: 'place_id,user_id' }
      )
    setSaving(false)

    if (error) {
      setError(error.message)
    } else {
      setError(null)
      await loadPlaces()
    }
  }

  // Pede a localização ao browser. O resultado diz se correu bem (ok = true).
  function locate(onDone?: (ok: boolean) => void) {
    if (!navigator.geolocation) {
      setLocationError('Este browser não permite obter a localização.')
      onDone?.(false)
      return
    }
    setLocating(true)
    setLocationError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude])
        setLocating(false)
        onDone?.(true)
      },
      (err) => {
        setLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError(
            'O acesso à localização está bloqueado. Clica no cadeado ao lado do endereço do site, permite a localização e tenta outra vez.'
          )
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setLocationError(
            'Não conseguimos detetar a tua posição. Verifica se o GPS ou a internet estão ligados e tenta outra vez.'
          )
        } else {
          setLocationError('Demorou demasiado a obter a tua localização. Tenta outra vez.')
        }
        onDone?.(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    )
  }

  // Só avança para a lista depois de conseguir a localização
  function start(choice: Filter) {
    setFilter(choice)
    locate((ok) => {
      if (ok) setView('list')
    })
  }

  function showMap(placeId: string | null) {
    setSelectedId(placeId)
    setView('map')
  }

  if (view === 'welcome') {
    return (
      <Welcome
        loading={locating}
        error={locationError}
        onChoose={start}
        onSkip={() => {
          setFilter('all')
          showMap(null)
        }}
      />
    )
  }

  if (view === 'list') {
    return (
      <ResultsList
        places={places}
        category={filter === 'fuel' ? 'fuel' : 'pharmacy'}
        userPos={userPos}
        locating={locating}
        locationError={locationError}
        onLocate={() => locate()}
        onBack={() => setView('welcome')}
        onShowMap={showMap}
      />
    )
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-ink">
      <Header
        places={places}
        filter={filter}
        onFilter={setFilter}
        onPick={setSelectedId}
        onHome={() => setView('welcome')}
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar filter={filter} onFilter={setFilter} counts={counts} />

        <main className="relative min-w-0 flex-1">
          <MapArea
            places={visiblePlaces}
            selectedPlace={selectedPlace}
            onSelect={setSelectedId}
            session={session}
            onReload={loadPlaces}
            userPos={userPos}
            onUserPos={setUserPos}
            error={error}
            onError={setError}
          />
        </main>

        <DetailPanel
          place={selectedPlace}
          reports={reports}
          session={session}
          userPos={userPos}
          saving={saving}
          onClose={() => setSelectedId(null)}
          onStatus={reportStatus}
          onRate={rate}
        />
      </div>
    </div>
  )
}