import Link from 'next/link'
import { ArrowRight, Folder, FolderOpen } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientManagement } from '@/components/crm/client-management'
import { getCurrentRole } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

type FolderRow = { id:string; name:string; clients:{count:number}[] }

export default async function ClientsPage() {
  const role = await getCurrentRole()
  if (role !== 'admin') redirect('/dashboard')
  const supabase = await createClient()
  const [{ data: folderRows }, { count: total }, { count: unfiledCount }] = await Promise.all([
    supabase.from('client_folders').select('id,name,clients(count)').order('name'),
    supabase.from('clients').select('*', { count:'exact', head:true }),
    supabase.from('clients').select('*', { count:'exact', head:true }).is('folder_id', null),
  ])
  const folders = (folderRows ?? []) as unknown as FolderRow[]
  const folderOptions = folders.map(folder => ({ id:folder.id, name:folder.name }))

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-black">Dossiers clients</h1><p className="mt-1 text-sm text-slate-500">{total ?? 0} contact(s) réparti(s) dans {folders.length} dossier(s).</p></div>
    {role==='admin'&&<ClientManagement folders={folderOptions}/>}
    <section>
      <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Choisissez un dossier</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {folders.map(folder => { const count = folder.clients?.[0]?.count ?? 0; return <Link key={folder.id} href={`/clients/folders/${folder.id}`} className="card group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600"><Folder size={30}/></div><div className="min-w-0 flex-1"><h3 className="truncate text-base font-black text-slate-700">{folder.name}</h3><p className="mt-1 text-sm text-slate-500">{count} client(s)</p></div><ArrowRight size={19} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600"/></Link> })}
        {(unfiledCount ?? 0) > 0 && <Link href="/clients/folders/unfiled" className="card group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500"><FolderOpen size={30}/></div><div className="min-w-0 flex-1"><h3 className="truncate text-base font-black text-slate-700">Sans dossier</h3><p className="mt-1 text-sm text-slate-500">{unfiledCount} ancien(s) client(s)</p></div><ArrowRight size={19} className="text-slate-300 transition group-hover:translate-x-1"/></Link>}
        {!folders.length && !(unfiledCount ?? 0) && <div className="card col-span-full p-10 text-center text-sm text-slate-500">Aucun dossier. Créez votre premier client ou importez un fichier en indiquant un nouveau dossier.</div>}
      </div>
    </section>
  </div>
}
