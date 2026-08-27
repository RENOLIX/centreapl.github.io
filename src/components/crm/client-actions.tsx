'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarPlus, FileText, PhoneCall } from 'lucide-react'

type Result = { id: string; label: string }

export function ClientActions({ clientId, results, canCall }: { clientId: string; results: Result[]; canCall: boolean }) {
  const router = useRouter()
  const [message, setMessage] = useState('')

  async function submit(path: string, payload: object, form: HTMLFormElement) {
    setMessage('')
    const response = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
    const body = await response.json()
    if (!response.ok) return setMessage(body.error || 'Enregistrement impossible')
    form.reset()
    setMessage('Enregistré.')
    router.refresh()
  }

  async function saveCall(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const element=event.currentTarget; const form=new FormData(element); await submit(`/api/clients/${clientId}/calls`,{resultId:form.get('resultId'),durationSeconds:form.get('durationSeconds'),summary:form.get('summary')},element) }
  async function saveNote(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const element=event.currentTarget; const form=new FormData(element); await submit(`/api/clients/${clientId}/activity`,{type:'note',body:form.get('body')},element) }
  async function saveCallback(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const element=event.currentTarget; const form=new FormData(element); await submit(`/api/clients/${clientId}/activity`,{type:'callback',scheduledFor:form.get('scheduledFor'),body:form.get('body')},element) }

  if (!canCall) return <section className="card p-6"><p className="font-bold">Actions agent</p><p className="mt-2 text-sm text-slate-500">Les appels, notes et rappels sont enregistrés par un compte Agent actif.</p></section>
  return <section className="space-y-4"><div className="grid gap-4 lg:grid-cols-3"><form onSubmit={saveCall} className="card space-y-3 p-5"><div className="flex items-center gap-2 font-black"><PhoneCall size={18} className="text-amber-600"/>Résultat d’appel</div><select name="resultId" required className="w-full rounded-xl border border-slate-200 p-3"><option value="">Choisir un résultat</option>{results.map(result=><option key={result.id} value={result.id}>{result.label}</option>)}</select><input name="durationSeconds" type="number" min="0" placeholder="Durée en secondes" className="w-full rounded-xl border border-slate-200 p-3"/><textarea name="summary" placeholder="Résumé de l’appel" className="min-h-24 w-full rounded-xl border border-slate-200 p-3"/><button className="btn btn-primary w-full justify-center">Enregistrer</button></form><form onSubmit={saveNote} className="card space-y-3 p-5"><div className="flex items-center gap-2 font-black"><FileText size={18} className="text-sky-600"/>Ajouter une note</div><textarea name="body" required placeholder="Note interne" className="min-h-36 w-full rounded-xl border border-slate-200 p-3"/><button className="btn btn-primary w-full justify-center">Ajouter</button></form><form onSubmit={saveCallback} className="card space-y-3 p-5"><div className="flex items-center gap-2 font-black"><CalendarPlus size={18} className="text-emerald-600"/>Programmer un rappel</div><input name="scheduledFor" required type="datetime-local" className="w-full rounded-xl border border-slate-200 p-3"/><textarea name="body" placeholder="Motif du rappel" className="min-h-24 w-full rounded-xl border border-slate-200 p-3"/><button className="btn btn-primary w-full justify-center">Programmer</button></form></div>{message&&<p className="text-sm font-semibold text-amber-700">{message}</p>}</section>
}
