import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { LogIn, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AuthPanel() {
  const [session, setSession] = useState<Session | null>(null)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // Fecha o painel ao clicar fora dele
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

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
      setOpen(false)
      setPassword('')
    }
  }

  if (session) {
    const userEmail = session.user.email ?? ''
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-white/95 py-1.5 pl-1.5 pr-2 shadow-lg ring-1 ring-black/5 backdrop-blur">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold uppercase text-emerald-700">
          {userEmail.charAt(0) || '?'}
        </div>
        <span className="hidden max-w-[130px] truncate text-xs font-semibold text-slate-700 sm:block">
          {userEmail}
        </span>
        <button
          type="button"
          title="Sair"
          aria-label="Sair"
          onClick={() => supabase.auth.signOut()}
          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:bg-emerald-700 active:scale-95"
      >
        <LogIn className="h-4 w-4" />
        Entrar
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="absolute right-0 top-14 w-72 space-y-3 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/5"
        >
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
            </h2>
            <p className="text-xs text-slate-500">
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
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Palavra-passe (mín. 6)"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />

          {message && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{message}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? 'A processar...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setMessage(null)
            }}
            className="w-full text-center text-xs font-medium text-emerald-700 hover:underline"
          >
            {mode === 'login' ? 'Ainda não tens conta? Criar conta' : 'Já tens conta? Entrar'}
          </button>
        </form>
      )}
    </div>
  )
}