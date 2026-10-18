import { Fuel, HeartHandshake, Leaf, Plus, Search, ShieldCheck, Users } from 'lucide-react'
import { STATUS_COLORS } from '../lib/utils'
import Logo from './Logo'

const LEGEND = [
  { color: STATUS_COLORS.open, label: 'Aberto' },
  { color: STATUS_COLORS.closed, label: 'Fechado' },
  { color: STATUS_COLORS.out_of_stock, label: 'Sem stock / sem combustível' },
  { color: STATUS_COLORS.none, label: 'Sem informação (ninguém confirmou ainda)' },
]

const VALUES = [
  { icon: Leaf, label: 'Cidades mais limpas' },
  { icon: Users, label: 'Comunidade mais forte' },
  { icon: Leaf, label: 'Um futuro mais verde' },
]

export default function AboutView() {
  return (
    <div className="absolute inset-0 z-[1400] overflow-y-auto bg-slate-100">
      <div className="mx-auto max-w-2xl space-y-4 p-4 pb-10">
        <div className="rounded-3xl bg-gradient-to-br from-ink to-ink-soft p-6 text-white">
          <div className="flex items-center gap-3">
            <Logo className="h-14 w-14" />
            <div className="leading-tight">
              <h1 className="text-3xl font-extrabold tracking-wide">KUBIKA</h1>
              <p className="text-sm text-emerald-100/80">Serviços perto de ti.</p>
            </div>
          </div>
          <p className="mt-5 text-xl font-semibold italic leading-snug text-emerald-50">
            Uma Angola mais conectada, mais saudável, mais sustentável.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[11px] font-medium text-emerald-100">
            {VALUES.map(({ icon: Icon, label }, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/10 px-2 py-3">
                <Icon className="h-5 w-5 text-emerald-300" />
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-950">
            <Search className="h-5 w-5 text-brand" />
            Como usar
          </h2>
          <ol className="mt-3 space-y-3 text-sm text-slate-700">
            <li>
              <strong>1. Procura.</strong> Usa o mapa, a pesquisa ou o separador <em>Lista</em>, que mostra
              os locais mais próximos de ti.
            </li>
            <li>
              <strong>2. Vê o estado.</strong> Cada local mostra se está aberto, fechado ou sem stock, e há
              quanto tempo foi confirmado.
            </li>
            <li>
              <strong>3. Vai lá.</strong> Toca em <em>Como chegar</em> para abrir o caminho no teu telemóvel.
            </li>
          </ol>
        </div>

        <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-950">
            <HeartHandshake className="h-5 w-5 text-brand" />
            Como ajudar
          </h2>
          <p className="mt-3 text-sm text-slate-700">
            Passaste por uma farmácia ou bomba? Abre o local, toca em <strong>Reportar estado</strong> e diz
            se está aberta. Leva dois toques e ajuda quem procura a seguir. Para reportar, avaliar ou
            adicionar locais precisas de uma conta gratuita.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
          <h2 className="text-base font-bold text-slate-950">O que significam as cores</h2>
          <ul className="mt-3 space-y-2.5">
            {LEGEND.map((l) => (
              <li key={l.label} className="flex items-center gap-3 text-sm text-slate-700">
                <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: l.color }} />
                {l.label}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-6 border-t border-slate-100 pt-4 text-sm text-slate-700">
            <span className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white">
                <Plus className="h-4 w-4" strokeWidth={3.5} />
              </span>
              Farmácia
            </span>
            <span className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white">
                <Fuel className="h-4 w-4" />
              </span>
              Bomba
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-3xl bg-white p-5 text-xs text-slate-500 ring-1 ring-slate-200">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
          <p>
            A tua localização só é usada no teu ecrã para calcular distâncias. Os locais vêm do OpenStreetMap
            © colaboradores do OpenStreetMap, e o estado de cada um é confirmado pela comunidade, por isso
            pode estar desatualizado.
          </p>
        </div>
      </div>
    </div>
  )
}