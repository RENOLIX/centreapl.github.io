import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentRole } from '@/lib/admin-auth'
import { ClientList } from '@/components/crm/client-list'

export const dynamic = 'force-dynamic'

type Client = { id:string; first_name:string; last_name:string; phone:string; email:string; city:string; metadata:Record<string,unknown>; client_folders:{name:string}|null }

export default async function FolderClientsPage({ params, searchParams }: { params:Promise<{id:string}>; searchParams:Promise<{q?:string}> }) {
  const role = await getCurrentRole()
  if (role !== 'admin') redirect('/dashboard')
  const { id } = await params
  const { q = '' } = await searchParams
  const supabase = await createClient()
  const unfiled = id === 'unfiled'
  let folderName = 'Sans dossier'
  if (!unfiled) {
    const { data: folder } = await supabase.from('client_folders').select('name').eq('id', id).maybeSingle()
    if (!folder) notFound()
    folderName = folder.name
  }

  let query = supabase.from('clients').select('id,first_name,last_name,phone,email,city,metadata,client_folders(name)').order('created_at', { ascending: false })
  query = unfiled ? query.is('folder_id', null) : query.eq('folder_id', id)
  const clean = q.trim().replace(/[,%()]/g, '')
  if (clean) query = query.or(`first_name.ilike.%${clean}%,last_name.ilike.%${clean}%,phone.ilike.%${clean}%,city.ilike.%${clean}%`)
  const { data } = await query
  const clients = (data ?? []) as unknown as Client[]

  return <div className="space-y-6">
    <div><Link href="/clients" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700"><ArrowLeft size={16}/>Retour aux dossiers</Link><h1 className="mt-3 text-2xl font-black">{folderName}</h1><p className="mt-1 text-sm text-slate-500">{clients.length} client(s) affiché(s) dans ce dossier.</p></div>
    <section className="card overflow-hidden">
      <form className="flex border-b border-slate-100 p-4"><div className="relative flex-1"><Search size={17} className="absolute left-3 top-3 text-slate-400"/><input name="q" defaultValue={q} placeholder="Rechercher dans ce dossier" className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-amber-400"/></div><button className="btn btn-primary ml-2">Rechercher</button></form>
      <ClientList clients={clients} isAdmin={role === 'admin'} hasSearch={Boolean(q)}/>
    </section>
  </div>
}
