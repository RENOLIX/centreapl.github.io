import { Megaphone } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { isCurrentUserAdmin } from '@/lib/admin-auth'
import { CampaignManagement } from '@/components/crm/campaign-management'

export const dynamic = 'force-dynamic'
type Campaign={id:string;name:string;description:string;active:boolean;client_assignments:{client_id:string}[];calls:{id:string}[]}

export default async function Campaigns(){
  const supabase=await createClient()
  const isAdmin=await isCurrentUserAdmin()
  const [{data,error},{data:agents},{data:clients}]=await Promise.all([
    supabase.from('campaigns').select('id,name,description,active,client_assignments(client_id),calls(id)').order('created_at',{ascending:false}),
    isAdmin?supabase.from('agents').select('id,code,users(full_name)').eq('active',true):Promise.resolve({data:[]}),
    isAdmin?supabase.from('clients').select('id,first_name,last_name,phone').order('created_at',{ascending:false}).limit(500):Promise.resolve({data:[]}),
  ])
  const campaigns=(data??[]) as unknown as Campaign[]
  const agentOptions=(agents??[]).map(agent=>({id:agent.id,label:`${(agent.users as unknown as {full_name:string}|null)?.full_name||agent.code} (${agent.code})`}))
  const clientOptions=(clients??[]).map(client=>({id:client.id,label:`${client.first_name} ${client.last_name} · ${client.phone}`}))
  return <div className="space-y-6"><div><h1 className="text-2xl font-black">Campagnes</h1><p className="mt-1 text-sm text-slate-500">Listes de prospection, scripts et affectations manuelles.</p></div>{isAdmin&&<CampaignManagement campaigns={campaigns.filter(c=>c.active).map(c=>({id:c.id,label:c.name}))} agents={agentOptions} clients={clientOptions}/>}<div className="grid gap-4 md:grid-cols-2">{campaigns.map(campaign=>{const assigned=campaign.client_assignments?.length??0;const calls=campaign.calls?.length??0;const progress=assigned?Math.min(100,Math.round(calls/assigned*100)):0;return <div className="card p-6" key={campaign.id}><p className="text-xs font-bold uppercase tracking-wider text-amber-700">{campaign.active?'Active':'Suspendue'}</p><h2 className="mt-2 text-lg font-black">{campaign.name}</h2>{campaign.description&&<p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{campaign.description}</p>}<p className="mt-3 text-sm text-slate-500">{assigned} clients · {calls} appels · {progress}% traités</p><div className="mt-5 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-amber-400" style={{width:`${progress}%`}}/></div></div>})}{!campaigns.length&&<div className="card col-span-full flex flex-col items-center px-5 py-12 text-center"><Megaphone className="text-slate-300" size={34}/><p className="mt-3 font-bold">{error?'Base CRM indisponible':'Aucune campagne créée'}</p><p className="mt-1 text-sm text-slate-500">{error?error.message:'Créez la première campagne depuis le formulaire administrateur.'}</p></div>}</div></div>
}
