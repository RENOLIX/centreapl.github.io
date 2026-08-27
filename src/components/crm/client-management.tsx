'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { Plus, Upload } from 'lucide-react'

export function ClientManagement() {
  const router = useRouter()
  const [message, setMessage] = useState('')

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage('')
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const response = await fetch('/api/clients', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.fromEntries(form)) })
    const body = await response.json()
    if (!response.ok) return setMessage(body.error || 'Création impossible')
    formElement.reset(); setMessage('Client créé.'); router.refresh()
  }

  async function importCsv(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage('')
    const formElement = event.currentTarget
    const input = formElement.elements.namedItem('csv') as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    Papa.parse<Record<string,string>>(file, { header: true, skipEmptyLines: true, complete: async result => { const response=await fetch('/api/clients/import',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({rows:result.data})});const body=await response.json();if(!response.ok)return setMessage(body.error||'Import impossible');setMessage(`${body.accepted.length} client(s) importé(s), ${body.rejected.length} rejet(s).`);formElement.reset();router.refresh() } })
  }

  return <div className="grid gap-3 lg:grid-cols-2"><details className="card p-4"><summary className="flex cursor-pointer list-none items-center gap-2 font-bold"><Plus size={17}/>Nouveau client</summary><form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-2"><input name="firstName" required placeholder="Prénom" className="rounded-xl border border-slate-200 p-3"/><input name="lastName" required placeholder="Nom" className="rounded-xl border border-slate-200 p-3"/><input name="phone" required placeholder="Téléphone" className="rounded-xl border border-slate-200 p-3"/><input name="email" type="email" placeholder="Email" className="rounded-xl border border-slate-200 p-3"/><input name="city" placeholder="Ville" className="rounded-xl border border-slate-200 p-3"/><input name="notes" placeholder="Informations" className="rounded-xl border border-slate-200 p-3"/><button className="btn btn-primary justify-center sm:col-span-2">Créer</button></form></details><details className="card p-4"><summary className="flex cursor-pointer list-none items-center gap-2 font-bold"><Upload size={17}/>Importer un CSV</summary><form onSubmit={importCsv} className="mt-4 space-y-3"><input name="csv" required type="file" accept=".csv,text/csv" className="w-full rounded-xl border border-slate-200 p-3"/><p className="text-xs text-slate-500">Colonnes reconnues : prénom, nom, téléphone, email et ville.</p><button className="btn btn-primary w-full justify-center">Importer</button></form></details>{message&&<p className="text-sm font-semibold text-amber-700 lg:col-span-2">{message}</p>}</div>
}
