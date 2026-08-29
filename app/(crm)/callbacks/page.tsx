import { createClient } from '@/lib/supabase/server'
import { getCurrentRole } from '@/lib/admin-auth'
import { CallbackCalendar, type CalendarCallback } from '@/components/crm/callback-calendar'
import { redirect } from 'next/navigation'

export const dynamic='force-dynamic'
type Row={id:string;title:string;scheduled_for:string;note:string;clients:{id:string;first_name:string;last_name:string}|null}
type Assignment={clients:{id:string;first_name:string;last_name:string}|null}
export default async function Callbacks(){
  const role=await getCurrentRole();if(role!=='agent')redirect('/dashboard');const supabase=await createClient();const [{data},{data:assignments}]=await Promise.all([supabase.from('callbacks').select('id,title,scheduled_for,note,clients(id,first_name,last_name)').eq('status','scheduled').order('scheduled_for',{ascending:true}).limit(2000),supabase.from('client_assignments').select('clients(id,first_name,last_name)').eq('status','active').limit(2000)])
  const callbacks=((data??[]) as unknown as Row[]).map(row=>({id:row.id,title:row.title||'Rappel',scheduledFor:row.scheduled_for,note:row.note,clientId:row.clients?.id||null,clientName:row.clients?`${row.clients.first_name} ${row.clients.last_name}`:''})) satisfies CalendarCallback[]
  const clients=Array.from(new Map(((assignments??[]) as unknown as Assignment[]).filter(row=>row.clients).map(row=>[row.clients!.id,{id:row.clients!.id,name:`${row.clients!.first_name} ${row.clients!.last_name}`}])).values())
  return <div className="space-y-6"><div><h1 className="text-2xl font-black">Mon agenda de rappels</h1><p className="mt-1 text-sm text-slate-500">Créez, modifiez et supprimez librement vos rappels. Cet agenda est privé.</p></div><CallbackCalendar callbacks={callbacks} clients={clients}/></div>
}
