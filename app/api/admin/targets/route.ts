import { NextResponse } from 'next/server'
import { isCurrentUserAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PUT(request:Request){
  if(!await isCurrentUserAdmin())return NextResponse.json({error:'Accès administrateur requis'},{status:403})
  const input=await request.json() as {userId?:string;targetDate?:string;revenueTarget?:unknown;returnsTarget?:unknown}
  const revenue=Number(input.revenueTarget);const returns=Number(input.returnsTarget)
  if(!input.userId||!/^\d{4}-\d{2}-\d{2}$/.test(input.targetDate||'')||!Number.isFinite(revenue)||revenue<0||!Number.isInteger(returns)||returns<0)return NextResponse.json({error:'Objectif invalide'},{status:400})
  const admin=createAdminClient()
  const {data,error}=await admin.from('performance_targets').upsert({user_id:input.userId,target_date:input.targetDate,revenue_target:revenue,returns_target:returns,updated_at:new Date().toISOString()},{onConflict:'user_id,target_date'}).select('id').single()
  return NextResponse.json(error?{error:error.message}:{ok:true,id:data?.id},{status:error?500:200})
}
