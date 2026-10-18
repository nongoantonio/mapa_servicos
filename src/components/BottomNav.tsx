import { Info, List, Loader2, Map as MapIcon, Navigation, User } from 'lucide-react'

export type Tab = 'map' | 'list' | 'about'

export const TABS = [
  { id: 'map' as const, label: 'Mapa', icon: MapIcon },
  { id: 'list' as const, label: 'Lista', icon: List },
  { id: 'about' as const, label: 'Sobre', icon: Info },
]

const itemCls = (active: boolean) =>
  `flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
    active ? 'text-brand' : 'text-slate-500'
  }`

export default function BottomNav({
  tab,
  onTab,
  onLocate,
  locating,
  loggedIn,
  onProfile,
}: {
  tab: Tab
  onTab: (t: Tab) => void
  onLocate: () => void
  locating: boolean
  loggedIn: boolean
  onProfile: () => void
}) {
  const map = TABS[0]
  const list = TABS[1]
  const about = TABS[2]

  return (
    <nav className="relative z-[1600] grid grid-cols-5 items-end border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      <button type="button" onClick={() => onTab(map.id)} className={itemCls(tab === map.id)}>
        <map.icon className="h-6 w-6" />
        {map.label}
      </button>
      <button type="button" onClick={() => onTab(list.id)} className={itemCls(tab === list.id)}>
        <list.icon className="h-6 w-6" />
        {list.label}
      </button>

      {/* Botão central: perto de mim */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onLocate}
          aria-label="Perto de mim"
          className="-mt-7 mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-white shadow-xl shadow-brand/40 ring-4 ring-white transition active:scale-90"
        >
          {locating ? <Loader2 className="h-7 w-7 animate-spin" /> : <Navigation className="h-7 w-7" />}
        </button>
      </div>

      <button type="button" onClick={() => onTab(about.id)} className={itemCls(tab === about.id)}>
        <about.icon className="h-6 w-6" />
        {about.label}
      </button>
      <button type="button" onClick={onProfile} className={itemCls(false)}>
        <User className="h-6 w-6" />
        {loggedIn ? 'Perfil' : 'Entrar'}
      </button>
    </nav>
  )
}