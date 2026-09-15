import { redirect } from 'next/navigation'
import { getCurrentRole } from '@/lib/admin-auth'
import { createClient } from '@/lib/supabase/server'
import { TargetManagement } from '@/components/crm/target-management'

export const dynamic='force-dynamic'
export default async function TargetsPage(){const role=await getCurrentRole();if(role!=='admin')redirect('/dashboard');const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Algiers'}).format(new Date());const supabase=await createClient();const {data}=await supabase.from('users').select('id,full_name,email,role,performance_targets!left(revenue_target,returns_target,target_date)').in('role',['agent','supervisor']).order('full_name');const users=(data??[]).map(user=>({...user,target:(user.performance_targets as unknown as Array<{revenue_target:number;returns_target:number;target_date:string}>|null)?.find(target=>target.target_date===date)||null})) as Parameters<typeof TargetManagement>[0]['users'];return <div className="space-y-6"><div><h1 className="text-2xl font-black">Objectifs</h1><p className="mt-1 text-sm text-slate-500">Définissez le chiffre d’affaires et les retours pour chaque membre, chaque jour.</p></div><TargetManagement users={users} date={date}/></div>}
