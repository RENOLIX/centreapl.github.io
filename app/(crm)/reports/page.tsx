import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isCurrentUserManagement } from '@/lib/admin-auth'
import { CsvExport } from '@/components/crm/csv-export'

export const dynamic='force-dynamic'
type CallRow={id:string;called_at:string;duration_seconds:number;summary:string;clients:{first_name:string;last_name:string;phone:string}|null;agents:{code:string;users:{full_name:string}|null}|null;call_results:{label:string;is_success:boolean;is_sale:boolean}|null;campaigns:{name:string}|null}

export default async function Reports({searchParams}:{searchParams:Promise<{from?:string;to?:string}>}){
  if(!await isCurrentUserManagement()) redirect('/dashboard')
  const {from,to}=await searchParams
  const supabase=await createClient()
  let query=supabase.from('calls').select('id,called_at,duration_seconds,summary,clients(first_name,last_name,phone),agents(code,users(full_name)),call_results(label,is_success,is_sale),campaigns(name)').order('called_at',{ascending:false}).limit(2000)
  if(from) query=query.gte('called_at',`${from}T00:00:00`)
  if(to) query=query.lte('called_at',`${to}T23:59:59`)
  const {data,error}=await query
  const calls=(data??[]) as unknown as CallRow[]
  const csv=calls.map(call=>({Date:new Date(call.called_at).toLocaleString('fr-DZ'),Agent:call.agents?.users?.full_name||call.agents?.code||'',Client:call.clients?`${call.clients.first_name} ${call.clients.last_name}`:'',Telephone:call.clients?.phone||'',Campagne:call.campaigns?.name||'',Resultat:call.call_results?.label||'',Succes:call.call_results?.is_success?'Oui':'Non',Vente:call.call_results?.is_sale?'Oui':'Non',Duree_secondes:call.duration_seconds,Resume:call.summary}))
  return <div className="space-y-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-black">Rapports d’appels</h1><p className="mt-1 text-sm text-slate-500">Historique réel, filtrable et exportable.</p></div><CsvExport rows={csv} filename="rapport-centre-appel.csv"/></div><form className="card grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto]"><label className="text-sm font-bold">Du<input type="date" name="from" defaultValue={from} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal"/></label><label className="text-sm font-bold">Au<input type="date" name="to" defaultValue={to} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal"/></label><button className="btn btn-primary self-end justify-center">Filtrer</button></form><section className="card overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Date</th><th className="p-4">Agent</th><th className="p-4">Client</th><th className="p-4">Campagne</th><th className="p-4">Résultat</th><th className="p-4">Durée</th></tr></thead><tbody className="divide-y divide-slate-100">{calls.map(call=><tr key={call.id}><td className="p-4">{new Date(call.called_at).toLocaleString('fr-DZ')}</td><td className="p-4 font-semibold">{call.agents?.users?.full_name||call.agents?.code||'—'}</td><td className="p-4">{call.clients?`${call.clients.first_name} ${call.clients.last_name}`:'—'}</td><td className="p-4">{call.campaigns?.name||'—'}</td><td className="p-4"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">{call.call_results?.label||'Sans résultat'}</span></td><td className="p-4">{call.duration_seconds}s</td></tr>)}{!calls.length&&<tr><td colSpan={6} className="p-10 text-center text-slate-500">{error?error.message:'Aucun appel sur cette période.'}</td></tr>}</tbody></table></section></div>
}
