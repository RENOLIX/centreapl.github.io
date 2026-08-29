import Link from 'next/link'
import { AlertTriangle, Bell, CheckCircle2, Coffee } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentRole } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import { EmergencyActions } from '@/components/crm/emergency-actions'

export const dynamic='force-dynamic'
type Emergency={id:string;agent_id:string;agent_name:string;agent_code:string;message:string;created_at:string;acknowledged_at:string|null}
type Pause={id:string;started_at:string;pause_type:string;agents:{id:string;code:string;users:{full_name:string}|null}|null}
export default async function Notifications(){
  const role=await getCurrentRole();if(role==='agent')redirect('/work');const supabase=await createClient()
  const [{data:emergencyRows},{data:pauseRows}]=await Promise.all([
    supabase.from('emergency_alerts').select('id,agent_id,agent_name,agent_code,message,created_at,acknowledged_at').order('created_at',{ascending:false}).limit(300),
    supabase.from('pause_sessions').select('id,started_at,pause_type,agents(id,code,users(full_name))').is('ended_at',null).order('started_at'),
  ])
  const emergencies=(emergencyRows??[]) as Emergency[];const pauses=(pauseRows??[]) as unknown as Pause[]
  return <div className="space-y-6"><div><h1 className="flex items-center gap-3 text-2xl font-black"><Bell className="text-amber-500"/>Notifications</h1><p className="mt-1 text-sm text-slate-500">Les urgences agents apparaissent ici instantanément et restent enregistrées.</p></div><section className="card overflow-hidden"><div className="panel-title flex items-center gap-2"><AlertTriangle size={15} className="text-red-600"/>Urgences agents</div><div className="divide-y">{emergencies.map(item=><div key={item.id} className={`p-4 ${item.acknowledged_at?'bg-white':'bg-red-50'}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-slate-800">{item.agent_name} <span className="text-xs text-slate-400">· {item.agent_code}</span></p><p className="mt-1 text-sm font-semibold text-red-700">{item.message}</p><p className="mt-1 text-xs text-slate-500">{new Date(item.created_at).toLocaleString('fr-DZ')}</p></div>{item.acknowledged_at?<span className="flex items-center gap-1 text-xs font-bold text-emerald-700"><CheckCircle2 size={15}/>Prise en charge</span>:<EmergencyActions id={item.id}/>}</div></div>)}{!emergencies.length&&<p className="p-8 text-center text-sm text-slate-500">Aucune urgence reçue.</p>}</div></section><section className="card"><div className="panel-title flex items-center gap-2"><Coffee size={15}/>Agents actuellement en pause</div><div className="divide-y">{pauses.map(item=><Link href="/pauses" key={item.id} className="block p-4 hover:bg-slate-50"><p className="font-bold">{item.agents?.users?.full_name||item.agents?.code||'Agent'}</p><p className="text-xs text-slate-500">{item.pause_type==='coffee'?'Pause café':'Pause déjeuner'} depuis {new Date(item.started_at).toLocaleTimeString('fr-DZ')}</p></Link>)}{!pauses.length&&<p className="p-6 text-sm text-slate-500">Aucun agent en pause.</p>}</div></section></div>
}
