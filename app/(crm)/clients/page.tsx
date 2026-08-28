import Link from 'next/link'
import { Search, Phone, ChevronRight } from 'lucide-react'
import { telHref } from '@/lib/validators'
import { createClient } from '@/lib/supabase/server'
import { ClientManagement } from '@/components/crm/client-management'
import { ClientAdminActions } from '@/components/crm/client-admin-actions'
import { getCurrentRole } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export const dynamic='force-dynamic'
type Client={id:string;first_name:string;last_name:string;phone:string;email:string;city:string;metadata:Record<string,unknown>}

export default async function ClientsPage({searchParams}:{searchParams:Promise<{q?:string}>}){
  const role=await getCurrentRole()
  if(role==='agent')redirect('/work')
  const {q=''}=await searchParams
  let data:Client[]=[];let count=0
  try{const supabase=await createClient();let query=supabase.from('clients').select('id,first_name,last_name,phone,email,city,metadata',{count:'exact'}).order('created_at',{ascending:false});const clean=q.trim().replace(/[,%()]/g,'');if(clean)query=query.or(`first_name.ilike.%${clean}%,last_name.ilike.%${clean}%,phone.ilike.%${clean}%,city.ilike.%${clean}%`);const result=await query;data=(result.data??[]) as Client[];count=result.count??0}catch{}
  return <div className="space-y-6"><div><h1 className="text-2xl font-black">Clients</h1><p className="mt-1 text-sm text-slate-500">{count} contact(s) accessible(s) depuis Supabase.</p></div><ClientManagement/><section className="card overflow-hidden"><form className="flex border-b border-slate-100 p-4"><div className="relative flex-1"><Search size={17} className="absolute left-3 top-3 text-slate-400"/><input name="q" defaultValue={q} placeholder="Rechercher un nom, téléphone ou ville" className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-amber-400"/></div><button className="btn btn-primary ml-2">Rechercher</button></form><div className="divide-y divide-slate-100">{data.map(client=><div key={client.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-amber-100 font-black text-amber-800">{client.first_name[0]}{client.last_name[0]}</div><div><Link href={`/clients/${client.id}`} className="font-bold hover:text-amber-700">{client.first_name} {client.last_name}</Link><p className="text-xs text-slate-500">{client.city||'Ville non renseignée'} · {client.phone}</p></div></div><div className="flex flex-wrap items-center gap-2">{role==='admin'&&<ClientAdminActions client={client}/>}<a href={telHref(client.phone)} className="btn btn-primary text-sm"><Phone size={15}/>Appeler</a><Link href={`/clients/${client.id}`} aria-label="Ouvrir la fiche"><ChevronRight size={18} className="text-slate-400"/></Link></div></div>)}{!data.length&&<p className="p-8 text-center text-sm text-slate-500">{q?'Aucun client trouvé.':'Aucun client enregistré.'}</p>}</div></section></div>
}
