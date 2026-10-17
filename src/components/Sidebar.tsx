import { Fuel, Info, Map as MapIcon, MapPin, MessageSquare, Plus, SlidersHorizontal } from 'lucide-react'
import { FILTERS, type Filter } from './Header'
import { STATUS_COLORS } from '../lib/utils'

const LEGEND = [
  { color: STATUS_COLORS.open, label: 'Aberto' },
  { color: STATUS_COLORS.closed, label: 'Fechado' },
  { color: STATUS_COLORS.out_of_stock, label: 'Sem stock' },
  { color: STATUS_COLORS.none, label: 'Sem informação' },
]

export default function Sidebar({
  filter,
  onFilter,
  counts,
}: {
  filter: Filter
  onFilter: (f: Filter) => void
  counts: { all: number; pharmacy: number; fuel: number }
}) {
  return (
    <aside className="hidden w-[280px] shrink-0 flex-col overflow-y-auto bg-ink px-4 pb-5 text-slate-200 lg:flex">
      {/* Navegação */}
      <nav className="space-y-1 pt-2">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl bg-ink-soft px-4 py-3 text-sm font-semibold text-white ring-1 ring-brand/40"
        >
          <MapIcon className="h-5 w-5 text-brand" />
          Mapa
        </button>
        {[
          { icon: MessageSquare, label: 'Meus reportes' },
          { icon: Info, label: 'Sobre' },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            disabled
            title="Em breve"
            className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300/80"
          >
            <Icon className="h-5 w-5" />
            {label}
            <span className="ml-auto rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
              Em breve
            </span>
          </button>
        ))}
      </nav>

      <div className="my-4 border-t border-white/10" />

      {/* Filtros */}
      <div className="flex items-center gap-2 px-1 text-sm font-semibold text-white">
        <SlidersHorizontal className="h-4 w-4" />
        Filtros
      </div>
      <div className="mt-3 space-y-2">
        {FILTERS.map((f) => {
          const active = filter === f.id
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onFilter(f.id)}
              className={`flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                active ? 'bg-brand text-white shadow-lg shadow-brand/30' : 'bg-white/5 text-slate-200 hover:bg-white/10'
              }`}
            >
              {f.id === 'pharmacy' && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Plus className="h-3.5 w-3.5" strokeWidth={3.5} />
                </span>
              )}
              {f.id === 'fuel' && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white ring-1 ring-white/40">
                  <Fuel className="h-3.5 w-3.5" />
                </span>
              )}
              {f.label}
              <span className={`ml-auto text-xs ${active ? 'text-white/80' : 'text-slate-400'}`}>
                {counts[f.id]}
              </span>
            </button>
          )
        })}
      </div>

      <div className="my-4 border-t border-white/10" />

      {/* Legenda */}
      <div className="px-1 text-sm font-semibold text-white">Legenda</div>
      <ul className="mt-3 space-y-2.5 px-1">
        {LEGEND.map((l) => (
          <li key={l.label} className="flex items-center gap-3 text-sm text-slate-200">
            <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: l.color }} />
            {l.label}
          </li>
        ))}
      </ul>

      {/* Números */}
      <div className="mt-5 space-y-4 rounded-2xl bg-ink-soft/60 p-4 ring-1 ring-white/10">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Plus className="h-6 w-6" strokeWidth={3.5} />
          </span>
          <div className="leading-tight">
            <div className="text-xl font-bold text-white">{counts.pharmacy}</div>
            <div className="text-xs text-slate-400">Farmácias</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white">
            <Fuel className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <div className="text-xl font-bold text-white">{counts.fuel}</div>
            <div className="text-xs text-slate-400">Bombas</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white">
            <MapPin className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <div className="text-xl font-bold text-white">{counts.all}</div>
            <div className="text-xs text-slate-400">Locais no mapa</div>
          </div>
        </div>
      </div>

      {/* Skyline + frase */}
      <div className="mt-auto pt-6 text-center">
        <svg viewBox="0 0 240 64" className="mx-auto w-full text-brand/70" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
          <path d="M0 60H12V42H22V52H30V32H38V52H48V38H56V52H66V24H70V10H72V24H76V52H90V40H100V52H112V30H122V52H134V44H146V52H160V36H170V52H184V46H196V52H210V40H222V52H240" />
        </svg>
        <div className="mt-3 text-sm leading-snug text-slate-300">
          Juntos por uma Luanda
          <br />
          mais informada!
        </div>
      </div>
    </aside>
  )
}
