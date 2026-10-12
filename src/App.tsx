import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export default function App() {
  const [status, setStatus] = useState('A testar ligação...')

  useEffect(() => {
    supabase.auth.getSession().then(({ error }) => {
      setStatus(error ? 'Erro: ' + error.message : 'Ligação ao Supabase OK')
    })
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-emerald-600">Mapa de Serviços</h1>
      <p className="mt-2 text-gray-600">{status}</p>
    </div>
  )
}