'use client'

import { FormEvent, useState } from 'react'
import { Loader2, Pencil, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Campaign = { id: string; name: string; description: string; active: boolean }

export function CampaignActions({ campaign }: { campaign: Campaign }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')

  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setMessage('')
    const data = new FormData(event.currentTarget)
    const response = await fetch('/api/campaigns', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: campaign.id,
        name: data.get('name'),
        description: data.get('description'),
        active: data.get('active') === 'true',
      }),
    })
    const body = await response.json()
    setPending(false)
    if (!response.ok) return setMessage(body.error || 'Modification impossible')
    setEditing(false)
    router.refresh()
  }

  async function remove() {
    if (pending || !window.confirm(`Supprimer définitivement la campagne « ${campaign.name} » ? Les historiques d’appels seront conservés.`)) return
    setPending(true)
    const response = await fetch('/api/campaigns', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: campaign.id }),
    })
    const body = await response.json()
    setPending(false)
    if (!response.ok) return setMessage(body.error || 'Suppression impossible')
    router.refresh()
  }

  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setEditing(true)} disabled={pending} className="btn btn-ghost text-xs"><Pencil size={14} />Modifier</button>
        <button onClick={() => void remove()} disabled={pending} className="btn border border-red-200 bg-red-50 text-xs text-red-700">
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}Supprimer
        </button>
      </div>
      {message && <p className="mt-2 text-xs font-bold text-red-600">{message}</p>}

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4">
          <form onSubmit={update} className="card w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between"><h3 className="text-lg font-black">Modifier la campagne</h3><button type="button" onClick={() => setEditing(false)}><X size={20} /></button></div>
            <label className="mt-5 block text-sm font-bold">Nom<input name="name" required defaultValue={campaign.name} className="mt-2 w-full rounded-xl border border-slate-200 p-3" /></label>
            <label className="mt-4 block text-sm font-bold">Description / script<textarea name="description" defaultValue={campaign.description} className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 p-3" /></label>
            <label className="mt-4 block text-sm font-bold">État<select name="active" defaultValue={String(campaign.active)} className="mt-2 w-full rounded-xl border border-slate-200 p-3"><option value="true">Active</option><option value="false">Suspendue</option></select></label>
            <button disabled={pending} className="btn btn-primary mt-5 w-full justify-center">{pending && <Loader2 size={16} className="animate-spin" />}Enregistrer</button>
          </form>
        </div>
      )}
    </div>
  )
}
