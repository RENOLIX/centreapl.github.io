'use client'

import { FormEvent, useState } from 'react'
import { Loader2, Pencil, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Client = {
  id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  city: string
  metadata: Record<string, unknown>
}

export function ClientAdminActions({ client }: { client: Client }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const information = typeof client.metadata?.information === 'string' ? client.metadata.information : ''
  const metadataValue = (key: string) => typeof client.metadata?.[key] === 'string' ? String(client.metadata[key]) : ''

  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setMessage('')
    const data = new FormData(event.currentTarget)
    const response = await fetch(`/api/clients/${client.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(data)),
    })
    const body = await response.json()
    setPending(false)
    if (!response.ok) return setMessage(body.error || 'Modification impossible')
    setEditing(false)
    router.refresh()
  }

  async function remove() {
    if (pending || !window.confirm(`Supprimer définitivement ${client.first_name} ${client.last_name} ? Ses affectations, appels, notes et rappels seront également supprimés.`)) return
    setPending(true)
    const response = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })
    const body = await response.json()
    setPending(false)
    if (!response.ok) return setMessage(body.error || 'Suppression impossible')
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setEditing(true)} disabled={pending} className="btn btn-ghost text-sm"><Pencil size={15} />Modifier</button>
      <button onClick={() => void remove()} disabled={pending} className="btn border border-red-200 bg-red-50 text-sm text-red-700">
        {pending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}Supprimer
      </button>
      {message && <span className="text-xs font-bold text-red-600">{message}</span>}

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4">
          <form onSubmit={update} className="card w-full max-w-xl p-6 text-left shadow-2xl">
            <div className="flex items-center justify-between"><h3 className="text-lg font-black">Modifier le contact</h3><button type="button" onClick={() => setEditing(false)}><X size={20} /></button></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <input name="firstName" required defaultValue={client.first_name} placeholder="Prénom" className="rounded-xl border border-slate-200 p-3" />
              <input name="lastName" required defaultValue={client.last_name} placeholder="Nom" className="rounded-xl border border-slate-200 p-3" />
              <input name="phone" required defaultValue={client.phone} placeholder="Téléphone" className="rounded-xl border border-slate-200 p-3" />
              <input name="email" type="email" defaultValue={client.email} placeholder="Email" className="rounded-xl border border-slate-200 p-3" />
              <input name="city" defaultValue={client.city} placeholder="Ville" className="rounded-xl border border-slate-200 p-3" />
              <input name="notes" defaultValue={information} placeholder="Informations" className="rounded-xl border border-slate-200 p-3" />
              <input name="phone2" defaultValue={metadataValue('telephone_2')} placeholder="Téléphone 2" className="rounded-xl border border-slate-200 p-3" />
              <input name="address" defaultValue={metadataValue('adresse')} placeholder="Adresse" className="rounded-xl border border-slate-200 p-3" />
              <input name="commune" defaultValue={metadataValue('commune')} placeholder="Commune" className="rounded-xl border border-slate-200 p-3" />
              <input name="wilaya" defaultValue={metadataValue('wilaya')} placeholder="Wilaya" className="rounded-xl border border-slate-200 p-3" />
              <input name="total" defaultValue={metadataValue('total')} placeholder="Total" className="rounded-xl border border-slate-200 p-3" />
              <input name="product" defaultValue={metadataValue('produit')} placeholder="Produit" className="rounded-xl border border-slate-200 p-3" />
            </div>
            <button disabled={pending} className="btn btn-primary mt-5 w-full justify-center">{pending && <Loader2 size={16} className="animate-spin" />}Enregistrer les modifications</button>
          </form>
        </div>
      )}
    </>
  )
}
