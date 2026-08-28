import { NextResponse } from 'next/server'
import { isCurrentUserAdmin } from '@/lib/admin-auth'
import { createClient } from '@/lib/supabase/server'

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function PUT(request:Request){
  if(!await isCurrentUserAdmin())return NextResponse.json({error:'Accès administrateur requis'},{status:403})
  const input=await request.json() as {supervisorId?:string;agentIds?:string[]}
  const agentIds=[...new Set(input.agentIds||[])]
  if(!input.supervisorId||!UUID.test(input.supervisorId)||agentIds.some(id=>!UUID.test(id)))return NextResponse.json({error:'Équipe invalide'},{status:400})
  const supabase=await createClient()
  const {data:supervisor}=await supabase.from('users').select('id').eq('id',input.supervisorId).eq('role','supervisor').maybeSingle()
  if(!supervisor)return NextResponse.json({error:'Superviseur introuvable'},{status:404})
  const {error:deleteError}=await supabase.from('supervisor_teams').delete().eq('supervisor_id',input.supervisorId)
  if(deleteError)return NextResponse.json({error:deleteError.message},{status:500})
  if(agentIds.length){const {error}=await supabase.from('supervisor_teams').insert(agentIds.map(agent_id=>({supervisor_id:input.supervisorId,agent_id})));if(error)return NextResponse.json({error:error.message},{status:500})}
  return NextResponse.json({saved:agentIds.length})
}
