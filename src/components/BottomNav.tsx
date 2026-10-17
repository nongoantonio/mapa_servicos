import { Info, List, Map as MapIcon } from 'lucide-react'

export type Tab = 'map' | 'list' | 'about'

export const TABS = [
  { id: 'map' as const, label: 'Mapa', icon: MapIcon },
  { id: 'list' as const, label: 'Lista', icon: List },
  { id: 'about' as const, label: 'Sobre', icon: Info },
]

export default function BottomNav({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <nav className="relative z-[1600] flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = tab === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onTab(id)}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
              active ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            <Icon className="h-6 w-6" />
            {label}
          </button>
        )
      })}
    </nav>
  )
}