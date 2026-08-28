'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { readSheet } from 'read-excel-file/browser'
import { Loader2, Plus, Upload } from 'lucide-react'

type ImportRow = Record<string, string>
type ExcelCell = string | number | boolean | Date | null | undefined

function cellText(value: ExcelCell) {
  if (value == null) return ''
  if (value instanceof Date) return value.toISOString()
  return String(value).trim()
}

async function readImportFile(file: File): Promise<ImportRow[]> {
  if (file.name.toLowerCase().endsWith('.xlsx')) {
    const sheet = await readSheet(file)
    if (sheet.length < 2) throw new Error('Le fichier Excel ne contient aucune ligne de client.')
    const headers = sheet[0].map((cell) => cellText(cell as ExcelCell))
    if (headers.every((header) => !header)) throw new Error('La première ligne doit contenir les titres des colonnes.')
    return sheet.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, cellText(row[index] as ExcelCell)])))
  }

  return await new Promise((resolve, reject) => {
    Papa.parse<ImportRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => result.errors.length ? reject(new Error(`CSV invalide : ${result.errors[0].message}`)) : resolve(result.data),
      error: (error) => reject(error),
    })
  })
}

export function ClientManagement() {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [importing, setImporting] = useState(false)

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const response = await fetch('/api/clients', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.fromEntries(form)) })
    const body = await response.json()
    if (!response.ok) return setMessage(body.error || 'Création impossible')
    formElement.reset()
    setMessage('Client créé.')
    router.refresh()
  }

  async function importFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (importing) return
    setMessage('')
    setImporting(true)
    const formElement = event.currentTarget
    const input = formElement.elements.namedItem('clientsFile') as HTMLInputElement
    const file = input.files?.[0]
    if (!file) {
      setImporting(false)
      return
    }

    try {
      const rows = await readImportFile(file)
      const response = await fetch('/api/clients/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Import impossible')
      const reasons = (body.rejected || []).slice(0, 5).map((item: { row: number; reason: string }) => `Ligne ${item.row} : ${item.reason}`).join('\n')
      setMessage(`${body.accepted.length} client(s) importé(s), ${body.rejected.length} rejet(s).${reasons ? `\n${reasons}` : ''}`)
      formElement.reset()
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Import impossible')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="grid items-start gap-3 lg:grid-cols-2">
      <details className="card self-start p-4">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-bold"><Plus size={17} />Nouveau client</summary>
        <form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input name="firstName" required placeholder="Prénom" className="rounded-xl border border-slate-200 p-3" />
          <input name="lastName" required placeholder="Nom" className="rounded-xl border border-slate-200 p-3" />
          <input name="phone" required placeholder="Téléphone" className="rounded-xl border border-slate-200 p-3" />
          <input name="email" type="email" placeholder="Email" className="rounded-xl border border-slate-200 p-3" />
          <input name="city" placeholder="Ville" className="rounded-xl border border-slate-200 p-3" />
          <input name="notes" placeholder="Informations" className="rounded-xl border border-slate-200 p-3" />
          <button className="btn btn-primary justify-center sm:col-span-2">Créer</button>
        </form>
      </details>

      <details className="card self-start p-4">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-bold"><Upload size={17} />Importer Excel ou CSV</summary>
        <form onSubmit={importFile} className="mt-4 space-y-3">
          <input name="clientsFile" required disabled={importing} type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="w-full rounded-xl border border-slate-200 p-3" />
          <p className="text-xs leading-5 text-slate-500">Formats acceptés : Excel .xlsx et CSV. La première ligne doit contenir les colonnes prénom, nom, téléphone, email et ville. Formatez les téléphones comme texte dans Excel pour conserver le zéro initial.</p>
          <button disabled={importing} className="btn btn-primary w-full justify-center disabled:opacity-60">{importing && <Loader2 size={16} className="animate-spin" />}{importing ? 'Import en cours…' : 'Importer les clients'}</button>
        </form>
      </details>
      {message && <p className="whitespace-pre-line text-sm font-semibold text-amber-700 lg:col-span-2">{message}</p>}
    </div>
  )
}
