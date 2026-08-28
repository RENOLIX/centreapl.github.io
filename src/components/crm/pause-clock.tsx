'use client'

import { useEffect, useState } from 'react'
import { Coffee, Loader2, Square, Utensils } from 'lucide-react'

type OpenPause = { id: string; pause_type: string; started_at: string }

function duration(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((value) => String(value).padStart(2, '0')).join(':')
}

export function PauseClock({ open }: { open: OpenPause | null }) {
  const [currentPause, setCurrentPause] = useState<OpenPause | null>(open)
  const [now, setNow] = useState(Date.now())
  const [pending, setPending] = useState<'coffee' | 'lunch' | 'stop' | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => setCurrentPause(open), [open])
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  async function start(type: 'coffee' | 'lunch') {
    if (pending || currentPause) return
    setPending(type)
    setMessage(type === 'coffee' ? 'Démarrage de la pause café…' : 'Démarrage de la pause déjeuner…')
    try {
      const response = await fetch('/api/pauses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Impossible de démarrer la pause')
      setCurrentPause(body)
      setNow(Date.now())
      setMessage('Pause démarrée.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Impossible de démarrer la pause')
    } finally {
      setPending(null)
    }
  }

  async function stop() {
    if (pending || !currentPause) return
    setPending('stop')
    setMessage('Arrêt de la pause…')
    try {
      const response = await fetch('/api/pauses', { method: 'PATCH' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Impossible de terminer la pause')
      setCurrentPause(null)
      setMessage('Pause terminée et enregistrée.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Impossible de terminer la pause')
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-4">
      {currentPause && (
        <div className="card border-l-4 border-l-orange-500 p-5 text-center">
          <p className="text-xs font-bold uppercase text-orange-600">
            {currentPause.pause_type === 'coffee' ? 'Pause café' : 'Pause déjeuner'} en cours
          </p>
          <p className="my-4 font-mono text-4xl font-black text-slate-700">
            {duration(now - new Date(currentPause.started_at).getTime())}
          </p>
          <button disabled={Boolean(pending)} onClick={() => void stop()} className="btn bg-red-500 text-white hover:bg-red-600 disabled:opacity-60">
            {pending === 'stop' ? <Loader2 size={16} className="animate-spin" /> : <Square size={16} />}
            {pending === 'stop' ? 'Arrêt…' : 'Fin de pause'}
          </button>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <button disabled={Boolean(currentPause || pending)} onClick={() => void start('coffee')} className="card flex min-h-44 flex-col items-center justify-center p-6 text-center transition hover:border-amber-400 disabled:cursor-not-allowed disabled:opacity-40">
          {pending === 'coffee' ? <Loader2 size={42} className="animate-spin text-amber-600" /> : <Coffee size={42} className="text-amber-600" />}
          <p className="mt-4 text-lg font-black">{pending === 'coffee' ? 'Démarrage…' : 'Pause café'}</p>
          <p className="mt-1 text-xs text-slate-500">Un seul clic suffit</p>
        </button>
        <button disabled={Boolean(currentPause || pending)} onClick={() => void start('lunch')} className="card flex min-h-44 flex-col items-center justify-center p-6 text-center transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-40">
          {pending === 'lunch' ? <Loader2 size={42} className="animate-spin text-emerald-600" /> : <Utensils size={42} className="text-emerald-600" />}
          <p className="mt-4 text-lg font-black">{pending === 'lunch' ? 'Démarrage…' : 'Pause déjeuner'}</p>
          <p className="mt-1 text-xs text-slate-500">Un seul clic suffit</p>
        </button>
      </div>
      {message && <p className={`text-sm font-bold ${message.includes('Impossible') || message.includes('requis') ? 'text-red-600' : 'text-emerald-700'}`}>{message}</p>}
    </div>
  )
}
