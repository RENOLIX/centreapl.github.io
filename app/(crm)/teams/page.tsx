import { redirect } from 'next/navigation'
import { getCurrentRole } from '@/lib/admin-auth'
import { createClient } from '@/lib/supabase/server'
import { TeamAssignment } from '@/components/crm/team-assignment'

export const dynamic='force-dynamic'
export default async function TeamsPage(){
  if(await getCurrentRole()!=='admin')redirect('/dashboard')
  const supabase=await createClient()
  const [{data:supervisorRows},{data:agentRows},{data:links}]=await Promise.all([
    supabase.from('users').select('id,full_name,email').eq('role','supervisor').order('full_name'),
    supabase.from('agents').select('id,code,users!inner(full_name,email,role)').eq('users.role','agent').eq('active',true).order('code'),
    supabase.from('supervisor_teams').select('supervisor_id,agent_id'),
  ])
  const supervisors=(supervisorRows??[]).map(row=>({id:row.id,name:row.full_name,email:row.email}))
  const agents=((agentRows??[]) as unknown as {id:string;code:string;users:{full_name:string;email:string}}[]).map(row=>({id:row.id,code:row.code,name:row.users.full_name,email:row.users.email}))
  const initial:Record<string,string[]>={};for(const link of links??[])(initial[link.supervisor_id]??=[]).push(link.agent_id)
  return <div className="space-y-6"><div><h1 className="text-2xl font-black">Équipes des superviseurs</h1><p className="mt-1 text-sm text-slate-500">Affectez les agents à leur superviseur. Les politiques RLS appliquent ensuite ce périmètre partout.</p></div><TeamAssignment supervisors={supervisors} agents={agents} initial={initial}/></div>
}
