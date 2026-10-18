import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import type { Place, PlaceStatus, StatusReport } from './types'
import Header, { type Filter } from './components/Header'
import BottomNav, { type Tab } from './components/BottomNav'
import MapArea from './components/MapArea'
import PlaceCard from './components/PlaceCard'
import DetailScreen from './components/DetailScreen'
import ResultsList from './components/ResultsList'
import AboutView from './components/AboutView'
import AuthDialog from './components/AuthDialog'

export default function App() {
  const [places, setPlaces] = useState<Place[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [session, setSession] = useState<Session | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('map')
  const [listCategory, setListCategory] = useState<Place['category']>('pharmacy')
  const [userPos, setUserPos] = useState<[number, number] | null>(null)
  const [reports, setReports] = useState<StatusReport[]>([])
  const [saving, setSaving] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [onlyOpen, setOnlyOpen] = useState(false)
  const [live, setLive] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)

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

  // Atualização em tempo real: quando alguém reporta ou avalia, o mapa actualiza sozinho
  useEffect(() => {
    const channel = supabase
      .channel('mapa-ao-vivo')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'status_reports' }, () => {
        loadPlaces()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
        loadPlaces()
      })
      .subscribe((status) => setLive(status === 'SUBSCRIBED'))
    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadPlaces])

  // Sempre que o local seleccionado muda, vai buscar os últimos reportes
  useEffect(() => {
    if (selectedId) loadReports(selectedId)
    else setReports([])
  }, [selectedId, loadReports])

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

  // Ao abrir a app, pede a localização para mostrar o que está mais perto
  useEffect(() => {
    locate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visiblePlaces = useMemo(
    () =>
      places.filter(
        (p) =>
          (filter === 'all' || p.category === filter) && (!onlyOpen || p.current_status === 'open')
      ),
    [places, filter, onlyOpen]
  )

  const selectedPlace = useMemo(
    () => places.find((p) => p.id === selectedId),
    [places, selectedId]
  )

  // Escolher um local (pelo mapa, pela pesquisa ou pela lista) leva sempre ao mapa
  function pickPlace(id: string) {
    setSelectedId(id)
    setDetailOpen(false)
    setTab('map')
  }

  function closeCard() {
    setSelectedId(null)
    setDetailOpen(false)
  }

  async function reportStatus(status: PlaceStatus): Promise<boolean> {
    if (!session || !selectedId) return false
    setSaving(true)
    const { error } = await supabase
      .from('status_reports')
      .insert({ place_id: selectedId, user_id: session.user.id, status })
    setSaving(false)

    if (error) {
      setError(error.message)
      return false
    }
    setError(null)
    await Promise.all([loadPlaces(), loadReports(selectedId)])
    return true
  }

  async function rate(rating: number): Promise<boolean> {
    if (!session || !selectedId) return false
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
      return false
    }
    setError(null)
    await loadPlaces()
    return true
  }

  return (
    <div className="flex h-dvh w-screen flex-col overflow-hidden bg-ink">
      <Header
        places={places}
        filter={filter}
        onFilter={setFilter}
        onPick={pickPlace}
        tab={tab}
        onTab={setTab}
        session={session}
        onOpenAuth={() => setAuthOpen(true)}
      />

      <main className="relative min-h-0 flex-1 bg-slate-100">
        <MapArea
          places={visiblePlaces}
          selectedPlace={selectedPlace}
          onSelect={(id) => {
            setSelectedId(id)
            setTab('map')
          }}
          session={session}
          onReload={loadPlaces}
          userPos={userPos}
          onUserPos={setUserPos}
          error={error}
          onError={setError}
          onlyOpen={onlyOpen}
          onToggleOpen={() => setOnlyOpen((v) => !v)}
          live={live}
          cardOpen={!!selectedPlace && !detailOpen}
        />

        {selectedPlace && !detailOpen && (
          <PlaceCard
            place={selectedPlace}
            userPos={userPos}
            onClose={closeCard}
            onDetails={() => setDetailOpen(true)}
          />
        )}

        {selectedPlace && detailOpen && (
          <DetailScreen
            place={selectedPlace}
            reports={reports}
            session={session}
            userPos={userPos}
            saving={saving}
            onClose={() => setDetailOpen(false)}
            onStatus={reportStatus}
            onRate={rate}
          />
        )}

        {tab === 'list' && (
          <ResultsList
            places={places}
            category={listCategory}
            onCategory={setListCategory}
            userPos={userPos}
            locating={locating}
            locationError={locationError}
            onLocate={() => locate()}
            onShowMap={pickPlace}
          />
        )}

        {tab === 'about' && <AboutView />}
      </main>

      <BottomNav
        tab={tab}
        onTab={setTab}
        onLocate={() => {
          setTab('map')
          locate()
        }}
        locating={locating}
        loggedIn={!!session}
        onProfile={() => setAuthOpen(true)}
      />

      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  )
}