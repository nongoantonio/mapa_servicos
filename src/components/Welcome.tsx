import { useState } from 'react'
import { ArrowRight, Droplet, Loader2, MapPin, Plus } from 'lucide-react'
import type { Filter } from './Header'

const OPTIONS = [
  {
    id: 'pharmacy' as const,
    title: 'Farmácia',
    subtitle: 'Ver as mais próximas de ti',
    circle: 'bg-emerald-600',
  },
  {
    id: 'fuel' as const,
    title: 'Bomba de combustível',
    subtitle: 'Ver as mais próximas de ti',
    circle: 'bg-brand',
  },
]

export default function Welcome({
  loading,
  onChoose,
  onSkip,
}: {
  loading: boolean
  onChoose: (choice: Filter) => void
  onSkip: () => void
}) {
  const [picked, setPicked] = useState<Filter | null>(null)

  return (
    <div className="flex min-h-screen w-screen flex-col items-center justify-center bg-gradient-to-b from-ink to-ink-soft px-5 py-10 text-white">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand shadow-lg shadow-brand/40">
          <MapPin className="h-8 w-8 text-white" />
        </div>
        <div className="mt-3 text-sm font-medium text-slate-300">Mapa de Serviços · Luanda</div>

        <h1 className="mt-8 text-3xl font-bold leading-tight sm:text-4xl">O que procuras agora?</h1>
        <p className="mt-3 text-base text-slate-300">
          Encontra farmácias e bombas de combustível perto de ti, com informação dada pela comunidade.
        </p>

        <div className="mt-8 space-y-4">
          {OPTIONS.map((o) => {
            const isLoading = loading && picked === o.id
            return (
              <button
                key={o.id}
                type="button"
                disabled={loading}
                onClick={() => {
                  setPicked(o.id)
                  onChoose(o.id)
                }}
                className="flex w-full items-center gap-4 rounded-3xl bg-white p-5 text-left text-slate-900 shadow-xl transition active:scale-[0.98] disabled:opacity-70"
              >
                <span
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white ${o.circle}`}
                >
                  {o.id === 'pharmacy' ? (
                    <Plus className="h-9 w-9" strokeWidth={3.5} />
                  ) : (
                    <Droplet className="h-8 w-8" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xl font-bold">{o.title}</span>
                  <span className="block text-sm text-slate-500">
                    {isLoading ? 'A procurar a tua localização...' : o.subtitle}
                  </span>
                </span>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 shrink-0 animate-spin text-slate-400" />
                ) : (
                  <ArrowRight className="h-6 w-6 shrink-0 text-slate-400" />
                )}
              </button>
            )
          })}
        </div>

        <p className="mt-6 text-xs leading-relaxed text-slate-400">
          Vamos pedir a tua localização para mostrar o que está mais perto. A tua posição só é usada no
          teu ecrã para calcular distâncias.
        </p>

        <button
          type="button"
          disabled={loading}
          onClick={onSkip}
          className="mt-5 text-sm font-medium text-sky-300 underline-offset-4 hover:underline disabled:opacity-60"
        >
          Prefiro ver tudo no mapa
        </button>
      </div>
    </div>
  )
}
