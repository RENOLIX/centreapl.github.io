'use client'

import { FormEvent, useMemo, useState } from 'react'
import { Loader2, Search, Upload, Video } from 'lucide-react'

type Recipient = { id:string; full_name:string; email:string; role:'agent'|'supervisor' }

export function HelpManagement({ recipients }: { recipients:Recipient[] }) {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const visible = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('fr')
    return needle ? recipients.filter(person => `${person.full_name} ${person.email} ${person.role === 'agent' ? 'agent' : 'superviseur'}`.toLocaleLowerCase('fr').includes(needle)) : recipients
  }, [recipients, search])

  async function upload(event:FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const form = event.currentTarget
    setPending(true); setMessage('')
    const response = await fetch('/api/admin/help', { method:'POST', body:new FormData(form) })
    const body = await response.json().catch(() => ({}))
    setPending(false)
    if (!response.ok) { setMessage(body.error || 'Téléversement impossible'); return }
    form.reset(); setSearch(''); setMessage('Vidéo publiée. Elle est visible uniquement par les destinataires choisis.')
  }

  return <section className="card p-6">
    <div className="flex gap-3"><Video className="text-emerald-600" /><div><h2 className="font-black">Créer une vidéo</h2><p className="mt-1 text-sm text-slate-500">La diffusion reste privée et ciblée.</p></div></div>
    <form onSubmit={upload} className="mt-6 space-y-4">
      <fieldset>
        <legend className="text-sm font-black">Afficher cette vidéo à</legend>
        <label className="relative mt-3 block"><Search size={16} className="absolute left-3 top-3.5 text-slate-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher un agent ou un superviseur…" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm" /></label>
        <div className="mt-2 grid max-h-64 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-3 sm:grid-cols-2">{visible.map(person => <label key={person.id} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-slate-50"><input name="recipientId" value={person.id} type="checkbox" /><span className="min-w-0"><span className="block truncate text-sm font-bold">{person.full_name}</span><span className="block truncate text-xs text-slate-500">{person.role === 'agent' ? 'Agent' : 'Superviseur'} · {person.email}</span></span></label>)}{!visible.length && <p className="text-sm text-slate-500">Aucun membre ne correspond à la recherche.</p>}</div>
      </fieldset>
      <input name="title" required maxLength={160} disabled={pending} placeholder="Titre de la vidéo" className="w-full rounded-xl border border-slate-200 p-3" />
      <textarea name="description" maxLength={2000} disabled={pending} placeholder="Description / consignes" className="min-h-24 w-full rounded-xl border border-slate-200 p-3" />
      <label className="block text-sm font-bold">Vidéo (MP4, WebM ou MOV — 500 Mo max)<input name="video" required disabled={pending} type="file" accept="video/mp4,video/webm,video/quicktime" className="mt-2 block w-full rounded-xl border border-dashed border-slate-300 p-3 text-sm" /></label>
      {message && <p className={`text-sm font-bold ${message.includes('impossible') ? 'text-red-600' : 'text-emerald-700'}`}>{message}</p>}
      <button disabled={pending || !recipients.length} className="btn btn-primary w-full justify-center disabled:opacity-50">{pending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} {pending ? 'Téléversement en cours…' : 'Publier la vidéo'}</button>
    </form>
  </section>
}
