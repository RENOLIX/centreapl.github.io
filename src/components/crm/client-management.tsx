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

type FolderOption = { id: string; name: string }

export function ClientManagement({ folders }: { folders: FolderOption[] }) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [importing, setImporting] = useState(false)

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const fullName = String(form.get('client') || '').trim()
    const nameParts = fullName.split(/\s+/).filter(Boolean)
    const firstName = nameParts.shift() || ''
    const lastName = nameParts.join(' ') || 'Client'
    const response = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        phone: form.get('tel1'),
        phone2: form.get('tel2'),
        address: form.get('address'),
        commune: form.get('commune'),
        wilaya: form.get('wilaya'),
        total: form.get('total'),
        product: form.get('product'),
        folderId: form.get('folderId'),
        folderName: form.get('folderName'),
      }),
    })
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
    const form = new FormData(formElement)
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
        body: JSON.stringify({ rows, folderId: form.get('folderId'), folderName: form.get('folderName') }),
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
          <label className="text-xs font-bold uppercase text-slate-500 sm:col-span-2">Dossier existant<select name="folderId" className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal normal-case"><option value="">Choisir un dossier</option>{folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>
          <label className="text-xs font-bold uppercase text-slate-500 sm:col-span-2">Ou créer un nouveau dossier<input name="folderName" placeholder="Ex. Prospects septembre" className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal normal-case" /></label>
          <p className="text-xs text-slate-500 sm:col-span-2">Choisissez un dossier existant ou saisissez un nouveau nom. Le nouveau dossier est prioritaire si les deux champs sont remplis.</p>
          <label className="text-xs font-bold uppercase text-slate-500 sm:col-span-2">Client — nom et prénom ensemble<input name="client" required placeholder="Ex. Mohamed Benali" className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal normal-case" /></label>
          <label className="text-xs font-bold uppercase text-slate-500">Tel 1<input name="tel1" required placeholder="Numéro principal" className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal normal-case" /></label>
          <label className="text-xs font-bold uppercase text-slate-500">Tel 2<input name="tel2" placeholder="Numéro secondaire" className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal normal-case" /></label>
          <label className="text-xs font-bold uppercase text-slate-500 sm:col-span-2">Adresse<input name="address" placeholder="Adresse complète" className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal normal-case" /></label>
          <label className="text-xs font-bold uppercase text-slate-500">Commune<input name="commune" placeholder="Commune" className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal normal-case" /></label>
          <label className="text-xs font-bold uppercase text-slate-500">Wilaya<input name="wilaya" placeholder="Wilaya" className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal normal-case" /></label>
          <label className="text-xs font-bold uppercase text-slate-500">Total<input name="total" placeholder="Montant total" className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal normal-case" /></label>
          <label className="text-xs font-bold uppercase text-slate-500">Produits<input name="product" placeholder="Produits" className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal normal-case" /></label>
          <button className="btn btn-primary justify-center sm:col-span-2">Créer</button>
        </form>
      </details>

      <details className="card self-start p-4">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-bold"><Upload size={17} />Importer Excel ou CSV</summary>
        <form onSubmit={importFile} className="mt-4 space-y-3">
          <select name="folderId" className="w-full rounded-xl border border-slate-200 p-3"><option value="">Choisir un dossier existant</option>{folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select>
          <input name="folderName" placeholder="Ou créer un nouveau dossier" className="w-full rounded-xl border border-slate-200 p-3" />
          <input name="clientsFile" required disabled={importing} type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="w-full rounded-xl border border-slate-200 p-3" />
          <p className="text-xs leading-5 text-slate-500">Formats acceptés : Excel .xlsx et CSV. Vos colonnes reconnues : client, tel 1, tel 2, adresse, commune, wilaya, total et produits. Formatez les téléphones comme texte dans Excel pour conserver le zéro initial.</p>
          <button disabled={importing} className="btn btn-primary w-full justify-center disabled:opacity-60">{importing && <Loader2 size={16} className="animate-spin" />}{importing ? 'Import en cours…' : 'Importer les clients'}</button>
        </form>
      </details>
      {message && <p className="whitespace-pre-line text-sm font-semibold text-amber-700 lg:col-span-2">{message}</p>}
    </div>
  )
}
