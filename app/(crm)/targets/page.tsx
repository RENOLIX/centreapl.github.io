import { redirect } from 'next/navigation'
import { getCurrentRole } from '@/lib/admin-auth'
import { createClient } from '@/lib/supabase/server'
import { TargetManagement } from '@/components/crm/target-management'

export const dynamic='force-dynamic'
export default async function TargetsPage(){const role=await getCurrentRole();if(role!=='admin')redirect('/dashboard');const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Algiers'}).format(new Date());const supabase=await createClient();const {data:members}=await supabase.from('users').select('id,full_name,email,role').in('role',['agent','supervisor']).order('full_name');const {data:targetRows}=await supabase.from('performance_targets').select('user_id,revenue_target,returns_target').eq('target_date',date);const targets=new Map((targetRows??[]).map(target=>[target.user_id,target]));const users=(members??[]).map(user=>({...user,target:targets.get(user.id)||null})) as Parameters<typeof TargetManagement>[0]['users'];return <div className="space-y-6"><div><h1 className="text-2xl font-black">Objectifs</h1><p className="mt-1 text-sm text-slate-500">Définissez le chiffre d’affaires et les retours pour chaque membre, chaque jour.</p></div><TargetManagement users={users} date={date}/></div>}
