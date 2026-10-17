import { useMemo, useState } from 'react'
import { Fuel, MapPin, Plus, Search } from 'lucide-react'
import AuthPanel from './AuthPanel'
import { PlaceIcon } from './ui'
import { TABS, type Tab } from './BottomNav'
import type { Place } from '../types'
import { CATEGORY_LABELS, normalize } from '../lib/utils'

export type Filter = 'all' | 'pharmacy' | 'fuel'

const FILTERS = [
  { id: 'all' as const, label: 'Todos', icon: MapPin },
  { id: 'pharmacy' as const, label: 'Farmácias', icon: Plus },
  { id: 'fuel' as const, label: 'Bombas', icon: Fuel },
]

function SearchBox({ places, onPick }: { places: Place[]; onPick: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (q.length < 2) return []
    return places
      .filter((p) => normalize(p.name).includes(q) || normalize(p.address ?? '').includes(q))
      .slice(0, 6)
  }, [places, query])

  return (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="Pesquisar por nome ou endereço..."
        className="h-12 w-full rounded-2xl bg-white/10 pl-12 pr-4 text-sm text-white placeholder:text-slate-400 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
      />

      {focused && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-14 z-[2000] overflow-hidden rounded-2xl bg-white py-1 text-slate-900 shadow-2xl ring-1 ring-slate-200">
          {results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500">Nenhum local encontrado.</div>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(p.id)
                  setQuery('')
                  setFocused(false)
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50"
              >
                <PlaceIcon category={p.category} className="h-9 w-9" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{p.name}</span>
                  <span className="block truncate text-xs text-slate-500">
                    {CATEGORY_LABELS[p.category]}
                    {p.address ? ` · ${p.address}` : ''}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function Chips({ filter, onFilter }: { filter: Filter; onFilter: (f: Filter) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto">
      {FILTERS.map(({ id, label, icon: Icon }) => {
        const active = filter === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onFilter(id)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white/10 text-slate-200 hover:bg-white/15'
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={id === 'pharmacy' ? 3 : 2} />
            {label}
          </button>
        )
      })}
    </div>
  )
}

export default function Header({
  places,
  filter,
  onFilter,
  onPick,
  tab,
  onTab,
}: {
  places: Place[]
  filter: Filter
  onFilter: (f: Filter) => void
  onPick: (id: string) => void
  tab: Tab
  onTab: (t: Tab) => void
}) {
  return (
    <header className="relative z-[1600] bg-ink text-white">
      <div className="flex items-center gap-3 px-4 py-3 lg:h-20 lg:gap-5 lg:px-6 lg:py-0">
        {/* Marca */}
        <button
          type="button"
          onClick={() => onTab('map')}
          className="flex shrink-0 items-center gap-3 text-left"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30">
            <MapPin className="h-6 w-6 text-white" />
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-bold">Mapa de Serviços</span>
            <span className="block text-xs text-slate-400">Luanda, Angola</span>
          </span>
        </button>

        {/* Computador: pesquisa e filtros na mesma barra */}
        <div className="hidden min-w-0 max-w-md flex-1 lg:flex">
          <SearchBox places={places} onPick={onPick} />
        </div>
        <div className="hidden lg:block">
          <Chips filter={filter} onFilter={onFilter} />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Computador: atalhos para Mapa, Lista e Sobre */}
          <div className="hidden items-center gap-1 rounded-full bg-white/5 p-1 lg:flex">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onTab(id)}
                title={label}
                className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                  tab === id ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden xl:inline">{label}</span>
              </button>
            ))}
          </div>
          <AuthPanel />
        </div>
      </div>

      {/* Telemóvel: pesquisa e filtros por baixo */}
      <div className="space-y-3 px-4 pb-3 lg:hidden">
        <SearchBox places={places} onPick={onPick} />
        <Chips filter={filter} onFilter={onFilter} />
      </div>
    </header>
  )
}