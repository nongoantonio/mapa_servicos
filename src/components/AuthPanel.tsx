import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export default function AuthPanel() {
  const [session, setSession] = useState<Session | null>(null)
  const [open, setOpen] = useState(false)
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
    return (
      <div className="absolute right-3 top-14 z-[1000] flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs shadow">
        <span className="max-w-[140px] truncate font-semibold text-gray-700">
          {session.user.email}
        </span>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="font-semibold text-red-600 hover:underline"
        >
          Sair
        </button>
      </div>
    )
  }

  return (
    <div className="absolute right-3 top-14 z-[1000]">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-700"
        >
          Entrar
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="w-64 space-y-3 rounded-2xl bg-white p-4 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Fechar
            </button>
          </div>

          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Palavra-passe (mín. 6)"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />

          {message && <p className="text-xs text-red-600">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? 'A processar...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setMessage(null)
            }}
            className="w-full text-center text-xs text-emerald-700 hover:underline"
          >
            {mode === 'login' ? 'Ainda não tens conta? Criar conta' : 'Já tens conta? Entrar'}
          </button>
        </form>
      )}
    </div>
  )
}