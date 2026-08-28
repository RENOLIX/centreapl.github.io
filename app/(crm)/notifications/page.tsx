import Link from 'next/link'
import { Bell, CalendarClock, Coffee } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentRole } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export const dynamic='force-dynamic'
type Callback={id:string;scheduled_for:string;note:string;clients:{first_name:string;last_name:string}|null}
type Pause={id:string;started_at:string;pause_type:string;agents:{id:string;code:string;users:{full_name:string}|null}|null}
export default async function Notifications(){
  const role=await getCurrentRole();if(role==='agent')redirect('/work');const supabase=await createClient()
  const [{data:callbackRows},{data:pauseRows}]=await Promise.all([
    supabase.from('callbacks').select('id,scheduled_for,note,clients(first_name,last_name)').eq('status','scheduled').order('scheduled_for').limit(100),
    supabase.from('pause_sessions').select('id,started_at,pause_type,agents(id,code,users(full_name))').is('ended_at',null).order('started_at'),
  ])
  const callbacks=(callbackRows??[]) as unknown as Callback[];const pauses=(pauseRows??[]) as unknown as Pause[]
  return <div className="space-y-6"><div><h1 className="flex items-center gap-3 text-2xl font-black"><Bell className="text-amber-500"/>Notifications</h1><p className="mt-1 text-sm text-slate-500">Éléments réels nécessitant votre attention.</p></div><div className="grid gap-4 xl:grid-cols-2"><section className="card"><div className="panel-title flex items-center gap-2"><CalendarClock size={15}/>Rappels programmés</div><div className="max-h-[520px] divide-y overflow-y-auto">{callbacks.map(item=><Link href="/callbacks" key={item.id} className="block p-4 hover:bg-slate-50"><p className="font-bold">{item.clients?`${item.clients.first_name} ${item.clients.last_name}`:'Client supprimé'}</p><p className="text-xs text-slate-500">{new Date(item.scheduled_for).toLocaleString('fr-DZ')}</p>{item.note&&<p className="mt-1 text-xs">{item.note}</p>}</Link>)}{!callbacks.length&&<p className="p-6 text-sm text-slate-500">Aucun rappel en attente.</p>}</div></section><section className="card"><div className="panel-title flex items-center gap-2"><Coffee size={15}/>Agents actuellement en pause</div><div className="divide-y">{pauses.map(item=><Link href="/pauses" key={item.id} className="block p-4 hover:bg-slate-50"><p className="font-bold">{item.agents?.users?.full_name||item.agents?.code||'Agent'}</p><p className="text-xs text-slate-500">{item.pause_type==='coffee'?'Pause café':'Pause déjeuner'} depuis {new Date(item.started_at).toLocaleTimeString('fr-DZ')}</p></Link>)}{!pauses.length&&<p className="p-6 text-sm text-slate-500">Aucun agent en pause.</p>}</div></section></div></div>
}
