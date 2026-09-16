'use client'

import { FormEvent, useState } from 'react'
import { Loader2, Upload, Video } from 'lucide-react'

export function HelpManagement() {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  async function upload(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending) return
    const form = event.currentTarget
    setPending(true); setMessage('')
    const response = await fetch('/api/admin/help', { method:'POST', body:new FormData(form) })
    const body = await response.json().catch(() => ({}))
    setPending(false)
    if (!response.ok) { setMessage(body.error || 'Téléversement impossible'); return }
    form.reset(); setMessage('Vidéo créée avec succès. Ouvrez « Mes vidéos » pour choisir les personnes qui pourront la voir.')
  }
  return <section className="card p-6"><div className="flex gap-3"><Video className="text-emerald-600" /><div><h1 className="font-black">Créer une vidéo</h1><p className="mt-1 text-sm text-slate-500">Ajoutez une vidéo, son titre et sa description.</p></div></div><form onSubmit={upload} className="mt-6 space-y-4"><input name="title" required maxLength={160} disabled={pending} placeholder="Titre de la vidéo" className="w-full rounded-xl border border-slate-200 p-3" /><textarea name="description" maxLength={2000} disabled={pending} placeholder="Description / consignes" className="min-h-24 w-full rounded-xl border border-slate-200 p-3" /><label className="block text-sm font-bold">Vidéo (MP4, WebM ou MOV — 500 Mo max)<input name="video" required disabled={pending} type="file" accept="video/mp4,video/webm,video/quicktime" className="mt-2 block w-full rounded-xl border border-dashed border-slate-300 p-3 text-sm" /></label>{message&&<p className={`text-sm font-bold ${message.includes('impossible')?'text-red-600':'text-emerald-700'}`}>{message}</p>}<button disabled={pending} className="btn btn-primary w-full justify-center disabled:opacity-50">{pending?<Loader2 size={16} className="animate-spin"/>:<Upload size={16}/>} {pending?'Téléversement en cours…':'Créer la vidéo'}</button></form></section>
}
