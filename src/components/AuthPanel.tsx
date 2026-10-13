import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { LogOut, User } from 'lucide-react'
import { supabase } from '../lib/supabase'

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20'

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
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-base font-bold uppercase text-white">
          {userEmail.charAt(0) || '?'}
        </div>
        <div className="hidden min-w-0 leading-tight sm:block">
          <div className="max-w-[150px] truncate text-sm font-semibold text-white">{userEmail}</div>
          <div className="text-[11px] text-slate-400">Sessão iniciada</div>
        </div>
        <button
          type="button"
          title="Sair"
          aria-label="Sair"
          onClick={() => supabase.auth.signOut()}
          className="rounded-full p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
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
        className="flex items-center gap-3 rounded-full text-left transition active:scale-95"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white">
          <User className="h-5 w-5" />
        </span>
        <span className="hidden leading-tight sm:block">
          <span className="block text-sm font-semibold text-white">Entrar</span>
          <span className="block text-[11px] text-slate-400">ou registar</span>
        </span>
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="absolute right-0 top-14 z-[2000] w-72 space-y-3 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200"
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
            <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-800">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'A processar...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setMessage(null)
            }}
            className="w-full text-center text-xs font-medium text-brand hover:underline"
          >
            {mode === 'login' ? 'Ainda não tens conta? Criar conta' : 'Já tens conta? Entrar'}
          </button>
        </form>
      )}
    </div>
  )
}
