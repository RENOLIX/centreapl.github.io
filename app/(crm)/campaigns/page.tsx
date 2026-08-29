import { Megaphone } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentRole } from '@/lib/admin-auth'
import { CampaignManagement } from '@/components/crm/campaign-management'
import { CampaignActions } from '@/components/crm/campaign-actions'
import { redirect } from 'next/navigation'

export const dynamic='force-dynamic'
type Campaign={id:string;name:string;description:string;active:boolean;client_assignments:{client_id:string}[];calls:{id:string}[]}
type AgentOption={id:string;code:string;active:boolean;users:{full_name:string;role:string}|null}

export default async function Campaigns(){
  const supabase=await createClient()
  const role=await getCurrentRole()
  if(role!=='admin')redirect('/dashboard')
  const isManagement=true
  const [{data,error},{data:clients},{data:agentRows},{data:folders}]=await Promise.all([
    supabase.from('campaigns').select('id,name,description,active,client_assignments(client_id),calls(id)').order('created_at',{ascending:false}),
    isManagement?supabase.from('clients').select('id,first_name,last_name,phone,folder_id').order('created_at',{ascending:false}).limit(2000):Promise.resolve({data:[]}),
    isManagement?supabase.from('agents').select('id,code,active,users(full_name,role)').eq('active',true).order('code'):Promise.resolve({data:[]}),
    isManagement?supabase.from('client_folders').select('id,name').order('name'):Promise.resolve({data:[]}),
  ])
  const campaigns=(data??[]) as unknown as Campaign[]
  const clientOptions=(clients??[]).map(client=>({id:client.id,label:`${client.first_name} ${client.last_name} · ${client.phone}`,folderId:client.folder_id||'__unfiled__'}))
  const folderOptions=[...(folders??[]).map(folder=>({id:folder.id,label:folder.name} as {id:string;label:string})),...((clients??[]).some(client=>!client.folder_id)?[{id:'__unfiled__',label:'Sans dossier (anciens clients)'}]:[])]
  const agentOptions=((agentRows??[]) as unknown as AgentOption[])
    .filter(agent=>agent.users?.role==='agent')
    .map(agent=>({id:agent.id,label:`${agent.users?.full_name||agent.code} · ${agent.code}`}))
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-black">Campagnes</h1><p className="mt-1 text-sm text-slate-500">Listes de prospection, scripts et distribution équilibrée.</p></div>
    {isManagement&&<CampaignManagement campaigns={campaigns.filter(c=>c.active).map(c=>({id:c.id,label:c.name}))} clients={clientOptions} agents={agentOptions} folders={folderOptions}/>}
    <div className="grid items-start gap-4 md:grid-cols-2">{campaigns.map(campaign=>{const assigned=campaign.client_assignments?.length??0;const calls=campaign.calls?.length??0;const progress=assigned?Math.min(100,Math.round(calls/assigned*100)):0;return <div className="card self-start p-6" key={campaign.id}><p className="text-xs font-bold uppercase tracking-wider text-amber-700">{campaign.active?'Active':'Suspendue'}</p><h2 className="mt-2 text-lg font-black">{campaign.name}</h2>{campaign.description&&<p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{campaign.description}</p>}<p className="mt-3 text-sm text-slate-500">{assigned} clients · {calls} appels · {progress}% traités</p><div className="mt-5 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-amber-400" style={{width:`${progress}%`}}/></div><CampaignActions campaign={campaign}/></div>})}{!campaigns.length&&<div className="card col-span-full flex flex-col items-center px-5 py-12 text-center"><Megaphone className="text-slate-300" size={34}/><p className="mt-3 font-bold">{error?'Base CRM indisponible':'Aucune campagne créée'}</p><p className="mt-1 text-sm text-slate-500">{error?error.message:'Créez la première campagne depuis le formulaire.'}</p></div>}</div>
  </div>
}
