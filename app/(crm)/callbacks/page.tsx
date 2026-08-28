import { createClient } from '@/lib/supabase/server'
import { getCurrentRole } from '@/lib/admin-auth'
import { CallbackCalendar, type CalendarCallback } from '@/components/crm/callback-calendar'

export const dynamic='force-dynamic'
type Row={id:string;scheduled_for:string;note:string;clients:{id:string;first_name:string;last_name:string}|null;agents:{users:{full_name:string}|null}|null}
export default async function Callbacks(){
  const role=await getCurrentRole();const supabase=await createClient();const {data}=await supabase.from('callbacks').select('id,scheduled_for,note,clients(id,first_name,last_name),agents(users(full_name))').eq('status','scheduled').order('scheduled_for',{ascending:true}).limit(2000)
  const callbacks=((data??[]) as unknown as Row[]).map(row=>({id:row.id,scheduledFor:row.scheduled_for,note:row.note,clientId:row.clients?.id||null,clientName:row.clients?`${row.clients.first_name} ${row.clients.last_name}`:'Client supprimé',agentName:row.agents?.users?.full_name||'Agent'})) satisfies CalendarCallback[]
  return <div className="space-y-6"><div><h1 className="text-2xl font-black">Calendrier des rappels</h1><p className="mt-1 text-sm text-slate-500">Cliquez sur un rappel pour afficher son détail et ouvrir la fiche concernée.</p></div><CallbackCalendar callbacks={callbacks} isAgent={role==='agent'}/></div>
}
