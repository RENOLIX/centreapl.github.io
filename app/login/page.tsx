'use client'

import { FormEvent, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')

    const { error: signInError } = await createClient().auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    // Recharge la route afin que les composants serveur lisent immédiatement le cookie Supabase.
    window.location.replace('/dashboard')
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-6">
      <form onSubmit={submit} className="card w-full max-w-md p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-400 font-black">CA</div>
          <div><h1 className="text-xl font-black">CentreAPL</h1><p className="text-sm text-slate-500">Espace centre d’appel manuel</p></div>
        </div>
        <label className="mb-2 block text-sm font-bold">Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required disabled={loading} className="mt-2 w-full rounded-xl border border-slate-200 p-3" />
        </label>
        <label className="mb-2 mt-5 block text-sm font-bold">Mot de passe
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required disabled={loading} className="mt-2 w-full rounded-xl border border-slate-200 p-3" />
        </label>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="btn btn-primary mt-6 w-full justify-center disabled:opacity-60">
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
        <p className="mt-5 text-center text-xs text-slate-500">Les appels sont effectués manuellement depuis votre téléphone.</p>
      </form>
    </main>
  )
}
