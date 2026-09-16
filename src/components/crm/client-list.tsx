'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ChevronRight, Loader2, Phone, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ClientAdminActions } from '@/components/crm/client-admin-actions'
import { telHref } from '@/lib/validators'

type Client = {
  id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  city: string
  metadata: Record<string, unknown>
  client_folders: { name: string } | null
}

type SelectionScope={folderId:string|null;total:number}
export function ClientList({ clients, isAdmin, hasSearch, selectionScope }: { clients: Client[]; isAdmin: boolean; hasSearch: boolean; selectionScope?:SelectionScope }) {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>([])
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [allFolderSelected, setAllFolderSelected] = useState(false)
  const allSelected = allFolderSelected || (clients.length > 0 && clients.every(client => selected.includes(client.id)));
  const selectedCount=allFolderSelected?selectionScope?.total||0:selected.length

  useEffect(() => {
    const visible = new Set(clients.map(client => client.id))
    if(!allFolderSelected)setSelected(current => current.filter(id => visible.has(id)))
  }, [clients,allFolderSelected])

  function toggleAll() {
    if(selectionScope){setAllFolderSelected(current=>!current);setSelected([]);return}
    setSelected(allSelected ? [] : clients.map(client => client.id))
  }

  function toggleClient(id:string){if(allFolderSelected){setAllFolderSelected(false);setSelected(clients.filter(client=>client.id!==id).map(client=>client.id));return}setSelected(current=>current.includes(id)?current.filter(value=>value!==id):[...current,id])}

  async function removeSelected() {
    if (!selectedCount || pending) return
    if (!window.confirm(`Supprimer définitivement ${selectedCount} client(s) ? Leurs affectations, appels, notes et rappels seront également supprimés.`)) return
    setPending(true)
    setMessage('')
    const response = await fetch('/api/clients/bulk-delete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(allFolderSelected ? { allFolder:true, folderId:selectionScope?.folderId??null } : { clientIds: selected }),
    })
    const body = await response.json()
    setPending(false)
    if (!response.ok) return setMessage(body.error || 'Suppression impossible')
    setMessage(`${body.deleted} client(s) supprimé(s).`)
    setSelected([])
    setAllFolderSelected(false)
    router.refresh()
  }

  return <>
    {isAdmin && clients.length > 0 && <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <label className="flex cursor-pointer items-center gap-2 text-sm font-bold"><input type="checkbox" checked={allSelected} onChange={toggleAll}/>{selectionScope?'Sélectionner tous les clients du dossier':'Sélectionner tous les clients affichés'}</label>
      <div className="flex items-center gap-3"><span className="text-xs text-slate-500">{selectedCount} sélectionné(s)</span><button type="button" onClick={() => void removeSelected()} disabled={!selectedCount || pending} className="btn border border-red-200 bg-red-50 text-sm text-red-700 disabled:opacity-40">{pending ? <Loader2 size={15} className="animate-spin"/> : <Trash2 size={15}/>}Supprimer la sélection</button></div>
    </div>}
    {message && <p className="border-b border-slate-100 p-3 text-sm font-bold text-amber-700">{message}</p>}
    <div className="divide-y divide-slate-100">
      {clients.map(client => <div key={client.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">{isAdmin && <input aria-label={`Sélectionner ${client.first_name} ${client.last_name}`} type="checkbox" checked={allFolderSelected||selected.includes(client.id)} onChange={() => toggleClient(client.id)}/>}<div className="grid h-10 w-10 place-items-center rounded-full bg-amber-100 font-black text-amber-800">{client.first_name[0]}{client.last_name[0]}</div><div><Link href={`/clients/${client.id}`} className="font-bold hover:text-amber-700">{client.first_name} {client.last_name}</Link><p className="text-xs text-slate-500">{client.city || 'Ville non renseignée'} · {client.phone}</p><p className="mt-1 text-[10px] font-bold uppercase text-emerald-700">{client.client_folders?.name || 'Sans dossier'}</p></div></div>
        <div className="flex flex-wrap items-center gap-2">{isAdmin && <ClientAdminActions client={client}/>}<a href={telHref(client.phone)} className="btn btn-primary text-sm"><Phone size={15}/>Appeler</a><Link href={`/clients/${client.id}`} aria-label="Ouvrir la fiche"><ChevronRight size={18} className="text-slate-400"/></Link></div>
      </div>)}
      {!clients.length && <p className="p-8 text-center text-sm text-slate-500">{hasSearch ? 'Aucun client trouvé.' : 'Aucun client enregistré.'}</p>}
    </div>
  </>
}
