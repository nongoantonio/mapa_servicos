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

  // Utilizador com sessão iniciada
  if (session) {
    const userEmail = session.user.email ?? ''
    return (
      <div className="flex items-center gap-2.5 rounded-2xl bg-slate-950 py-1.5 pl-1.5 pr-2 text-white shadow-lg">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400 text-sm font-bold uppercase text-navy">
          {userEmail.charAt(0) || '?'}
        </div>
        <div className="min-w-0 leading-tight">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Sessão iniciada</div>
          <div className="max-w-[150px] truncate text-xs font-semibold">{userEmail}</div>
        </div>
        <button
          type="button"
          title="Sair"
          aria-label="Sair"
          onClick={() => supabase.auth.signOut()}
          className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    )
  }

  // Sem sessão
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-2xl bg-navy px-4 py-3 text-xs font-semibold text-white shadow-lg transition hover:bg-navy-dark active:scale-95"
      >
        <LogIn className="h-4 w-4 text-sky-400" />
        Entrar
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="absolute right-0 top-14 w-72 space-y-3 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200"
        >
          <div>
            <h2 className="text-sm font-bold text-slate-950">
              {mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
            </h2>
            <div className="text-xs text-slate-500">
              {mode === 'login'
                ? 'Entra para reportar estados e avaliar locais.'
                : 'Junta-te à comunidade e ajuda os outros.'}
            </div>
          </div>

          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Palavra-passe (mín. 6)"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
          />

          {message && (
            <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-800">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-navy py-2.5 text-xs font-bold text-white transition hover:bg-navy-dark disabled:opacity-60"
          >
            {loading ? 'A processar...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setMessage(null)
            }}
            className="w-full text-center text-xs font-medium text-sky-700 hover:underline"
          >
            {mode === 'login' ? 'Ainda não tens conta? Criar conta' : 'Já tens conta? Entrar'}
          </button>
        </form>
      )}
    </div>
  )
}