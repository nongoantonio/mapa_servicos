import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { LogOut, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Logo from './Logo'

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20'

export default function AuthDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [session, setSession] = useState<Session | null>(null)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // Esc fecha a janela
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setLoading(false)
    if (error) {
      setMessage(error.message)
    } else {
      setPassword('')
      onClose()
    }
  }

  if (!open) return null

  const userEmail = session?.user.email ?? ''

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-end justify-center bg-black/55 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <div className="flex-1 leading-tight">
            <div className="text-lg font-extrabold tracking-wide text-ink">KUBIKA</div>
            <div className="text-xs text-slate-500">Serviços perto de ti.</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {session ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-lg font-bold uppercase text-white">
                {userEmail.charAt(0) || '?'}
              </div>
              <div className="min-w-0 leading-tight">
                <div className="truncate text-sm font-bold text-slate-900">{userEmail}</div>
                <div className="text-xs text-slate-500">Sessão iniciada</div>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Podes reportar o estado dos locais, avaliar e adicionar locais que faltam no mapa.
            </p>
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut()
                onClose()
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                {mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
              </h2>
              <p className="text-sm text-slate-500">
                {mode === 'login'
                  ? 'Entra para reportar estados e avaliar locais.'
                  : 'Junta-te à comunidade e ajuda os outros.'}
              </p>
            </div>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className={inputCls}
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Palavra-passe (mín. 6)"
              className={inputCls}
            />

            {message && (
              <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-800">{message}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-brand-dark py-3.5 text-base font-bold text-white transition hover:bg-brand active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? 'A processar...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setMessage(null)
              }}
              className="w-full text-center text-sm font-semibold text-brand hover:underline"
            >
              {mode === 'login' ? 'Ainda não tens conta? Criar conta' : 'Já tens conta? Entrar'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}