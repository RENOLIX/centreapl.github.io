import { createClient } from '@/lib/supabase/server'
import { getCurrentRole } from '@/lib/admin-auth'
import { PauseClock } from '@/components/crm/pause-clock'
import { LivePauseMonitor, type LivePause } from '@/components/crm/live-pause-monitor'

export const dynamic='force-dynamic'
const seconds=(row:{started_at:string;ended_at:string|null})=>Math.max(0,Math.floor((new Date(row.ended_at||Date.now()).getTime()-new Date(row.started_at).getTime())/1000))
const format=(total:number)=>`${String(Math.floor(total/3600)).padStart(2,'0')}:${String(Math.floor(total%3600/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`
type Row={id:string;pause_type:string;started_at:string;ended_at:string|null;agent_id:string;agents:{code:string;users:{full_name:string}|null}|null}
export default async function Pauses(){
  const role=await getCurrentRole();const supabase=await createClient();const {data:auth}=await supabase.auth.getUser();const {data:agent}=auth.user?await supabase.from('agents').select('id').eq('user_id',auth.user.id).maybeSingle():{data:null}
  const today=new Date();today.setHours(0,0,0,0)
  if(role==='agent'){
    const {data:own}=agent?await supabase.from('pause_sessions').select('id,pause_type,started_at,ended_at').eq('agent_id',agent.id).gte('started_at',today.toISOString()).order('started_at',{ascending:false}):{data:[]};const ownRows=own??[];const open=ownRows.find(row=>!row.ended_at)??null;const ownTotal=ownRows.reduce((total,row)=>total+seconds(row),0)
    return <div className="space-y-6"><div><h1 className="text-xl font-black">Pauses</h1><p className="text-sm text-slate-500">Chronométrage réel des pauses café et déjeuner.</p></div><div className="card p-4"><p className="text-xs uppercase text-slate-400">Temps de pause aujourd’hui</p><p className="mt-2 font-mono text-3xl font-black">{format(ownTotal)}</p></div><PauseClock open={open}/></div>
  }
  const {data}=await supabase.from('pause_sessions').select('id,agent_id,pause_type,started_at,ended_at,agents(code,users(full_name))').order('started_at',{ascending:false}).limit(1000)
  const rows=((data??[]) as unknown as Row[]).map(row=>({id:row.id,agentId:row.agent_id,agentName:row.agents?.users?.full_name||row.agents?.code||'Agent',agentCode:row.agents?.code||'',pauseType:row.pause_type,startedAt:row.started_at,endedAt:row.ended_at})) satisfies LivePause[]
  return <div className="space-y-6"><div><h1 className="text-2xl font-black">Pauses en temps réel</h1><p className="mt-1 text-sm text-slate-500">Compteurs actualisés chaque seconde pour votre équipe visible.</p></div><LivePauseMonitor rows={rows}/></div>
}
