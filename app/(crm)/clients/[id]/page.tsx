import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Phone } from 'lucide-react'
import { ClientActions } from '@/components/crm/client-actions'
import { getCurrentRole } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export default async function ClientPage({params}:{params:Promise<{id:string}>}){
  if(await getCurrentRole()==='agent')redirect('/work')
  const {id}=await params
  const supabase=await createClient()
  const [{data:client,error},{data:results},{data:notes},{data:calls},{data:callbacks},{data:auth}]=await Promise.all([
    supabase.from('clients').select('*').eq('id',id).single(),
    supabase.from('call_results').select('id,label').eq('active',true).order('label'),
    supabase.from('notes').select('id,body,created_at,agents(users(full_name))').eq('client_id',id).order('created_at',{ascending:false}),
    supabase.from('calls').select('id,summary,duration_seconds,called_at,call_results(label),agents(users(full_name))').eq('client_id',id).order('called_at',{ascending:false}),
    supabase.from('callbacks').select('id,note,scheduled_for,status').eq('client_id',id).order('scheduled_for',{ascending:false}),
    supabase.auth.getUser(),
  ])
  if(error||!client) notFound()
  const {data:agent}=auth.user?await supabase.from('agents').select('id').eq('user_id',auth.user.id).eq('active',true).maybeSingle():{data:null}
  const details=client.metadata&&Object.keys(client.metadata).length?JSON.stringify(client.metadata,null,2):'Aucune information enregistrée.'
  return <div className="mx-auto max-w-5xl space-y-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-black">{client.first_name} {client.last_name}</h1><p className="mt-1 text-sm text-slate-500">Fiche client et historique complet</p></div><a className="btn btn-primary" href={`tel:${client.phone}`}><Phone size={17}/>Appeler manuellement</a></div><section className="card grid gap-4 p-6 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase text-slate-400">Téléphone</p><a className="mt-1 block font-bold text-amber-700" href={`tel:${client.phone}`}>{client.phone||'Non renseigné'}</a></div><div><p className="text-xs font-bold uppercase text-slate-400">Ville</p><p className="mt-1 font-semibold">{client.city||'Non renseignée'}</p></div><div className="sm:col-span-2"><p className="text-xs font-bold uppercase text-slate-400">Informations</p><pre className="mt-1 whitespace-pre-wrap font-sans">{details}</pre></div></section><ClientActions clientId={id} results={results||[]} canCall={Boolean(agent)}/><section className="grid gap-4 lg:grid-cols-3"><div className="card p-5"><h2 className="font-black">Appels</h2><div className="mt-4 space-y-4">{calls?.map(call=><div key={call.id} className="border-b border-slate-100 pb-3"><p className="font-semibold">{(call.call_results as unknown as {label:string}|null)?.label||'Sans résultat'}</p><p className="text-xs text-slate-500">{new Date(call.called_at).toLocaleString('fr-DZ')} · {call.duration_seconds}s</p>{call.summary&&<p className="mt-1 text-sm">{call.summary}</p>}</div>)}{!calls?.length&&<p className="text-sm text-slate-500">Aucun appel enregistré.</p>}</div></div><div className="card p-5"><h2 className="font-black">Notes</h2><div className="mt-4 space-y-4">{notes?.map(note=><div key={note.id} className="border-b border-slate-100 pb-3"><p className="text-sm">{note.body}</p><p className="mt-1 text-xs text-slate-500">{new Date(note.created_at).toLocaleString('fr-DZ')}</p></div>)}{!notes?.length&&<p className="text-sm text-slate-500">Aucune note.</p>}</div></div><div className="card p-5"><h2 className="font-black">Rappels</h2><div className="mt-4 space-y-4">{callbacks?.map(callback=><div key={callback.id} className="border-b border-slate-100 pb-3"><p className="font-semibold">{new Date(callback.scheduled_for).toLocaleString('fr-DZ')}</p><p className="text-xs text-slate-500">{callback.status}</p>{callback.note&&<p className="mt-1 text-sm">{callback.note}</p>}</div>)}{!callbacks?.length&&<p className="text-sm text-slate-500">Aucun rappel.</p>}</div></div></section></div>
}
