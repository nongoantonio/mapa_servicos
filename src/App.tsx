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

  // Pede a localização ao browser (usado no ecrã inicial, na lista e no mapa)
  function locate(onDone?: () => void) {
    if (!navigator.geolocation) {
      onDone?.()
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude])
        setLocating(false)
        onDone?.()
      },
      () => {
        setLocating(false)
        onDone?.()
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  function start(choice: Filter) {
    setFilter(choice)
    locate(() => setView('list'))
  }

  function showMap(placeId: string | null) {
    setSelectedId(placeId)
    setView('map')
  }

  if (view === 'welcome') {
    return (
      <Welcome
        loading={locating}
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