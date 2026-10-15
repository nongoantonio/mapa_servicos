import { useMemo, useState } from 'react'
import { ChevronDown, Droplet, MapPin, Plus, Search } from 'lucide-react'
import AuthPanel from './AuthPanel'
import type { Place } from '../types'
import { CATEGORY_LABELS, normalize } from '../lib/utils'

export type Filter = 'all' | 'pharmacy' | 'fuel'

export const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'pharmacy', label: 'Farmácias' },
  { id: 'fuel', label: 'Bombas' },
]

export default function Header({
  places,
  filter,
  onFilter,
  onPick,
  onHome,
}: {
  places: Place[]
  filter: Filter
  onFilter: (f: Filter) => void
  onPick: (id: string) => void
  onHome: () => void
}) {
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
    <header className="relative z-[1200] bg-ink text-white">
      <div className="flex h-20 items-center gap-3 px-4 lg:gap-6 lg:px-6">
        {/* Marca */}
        <button
          type="button"
          onClick={onHome}
          title="Voltar ao início"
          className="flex shrink-0 items-center gap-3 text-left lg:w-[250px]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand shadow-lg shadow-brand/40">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <div className="hidden leading-tight sm:block">
            <div className="text-xl font-bold">Mapa de Serviços</div>
            <div className="text-xs text-slate-400">Luanda, Angola</div>
          </div>
        </button>

        {/* Pesquisa */}
        <div className="relative min-w-0 max-w-2xl flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Pesquisar por nome ou endereço..."
            className="h-12 w-full rounded-full bg-white/10 pl-12 pr-4 text-sm text-white placeholder:text-slate-400 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-brand/60"
          />

          {focused && query.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-14 overflow-hidden rounded-2xl bg-white py-1 text-slate-900 shadow-2xl ring-1 ring-slate-200">
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
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${
                        p.category === 'pharmacy' ? 'bg-emerald-600' : 'bg-brand'
                      }`}
                    >
                      {p.category === 'pharmacy' ? (
                        <Plus className="h-4 w-4" strokeWidth={3.5} />
                      ) : (
                        <Droplet className="h-4 w-4" />
                      )}
                    </span>
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

        {/* Cidade + login */}
        <div className="ml-auto flex items-center gap-4">
          <div className="hidden items-center gap-2 rounded-full bg-white/5 py-1.5 pl-1.5 pr-4 md:flex">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
              <MapPin className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium">Luanda</span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
          <AuthPanel />
        </div>
      </div>

      {/* Filtros em ecrãs pequenos (em ecrãs grandes ficam na barra lateral) */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onFilter(f.id)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold ${
              filter === f.id ? 'bg-brand text-white' : 'bg-white/10 text-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </header>
  )
}