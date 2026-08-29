import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params
  const input=await request.json() as {status?:'completed'|'cancelled';title?:string;note?:string;scheduledFor?:string;clientId?:string|null}
  const supabase=await createClient()
  const {data:auth}=await supabase.auth.getUser();if(!auth.user)return NextResponse.json({error:'Non authentifié'},{status:401})
  const {data:agent}=await supabase.from('agents').select('id').eq('user_id',auth.user.id).eq('active',true).maybeSingle();if(!agent)return NextResponse.json({error:'Compte agent actif requis'},{status:403})
  const update:Record<string,unknown>={updated_at:new Date().toISOString()}
  if(input.status){if(!['completed','cancelled'].includes(input.status))return NextResponse.json({error:'Statut invalide'},{status:400});update.status=input.status}
  if(input.title!==undefined){const title=input.title.trim();if(!title||title.length>120)return NextResponse.json({error:'Titre invalide'},{status:400});update.title=title}
  if(input.note!==undefined){if(input.note.length>1000)return NextResponse.json({error:'Note trop longue'},{status:400});update.note=input.note.trim()}
  if(input.scheduledFor!==undefined){const date=new Date(input.scheduledFor);if(Number.isNaN(date.getTime()))return NextResponse.json({error:'Date invalide'},{status:400});update.scheduled_for=date.toISOString()}
  if(input.clientId!==undefined){if(input.clientId){const {data:assignment}=await supabase.from('client_assignments').select('id').eq('agent_id',agent.id).eq('client_id',input.clientId).eq('status','active').maybeSingle();if(!assignment)return NextResponse.json({error:'Ce client ne vous est pas attribué'},{status:403})}update.client_id=input.clientId||null}
  if(Object.keys(update).length===1)return NextResponse.json({error:'Aucune modification'},{status:400})
  const {error}=await supabase.from('callbacks').update(update).eq('id',id)
  return NextResponse.json(error?{error:error.message}:{ok:true},{status:error?500:200})
}

export async function DELETE(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;const supabase=await createClient();const {data:auth}=await supabase.auth.getUser();if(!auth.user)return NextResponse.json({error:'Non authentifié'},{status:401});const {data:agent}=await supabase.from('agents').select('id').eq('user_id',auth.user.id).eq('active',true).maybeSingle();if(!agent)return NextResponse.json({error:'Compte agent actif requis'},{status:403});const {error}=await supabase.from('callbacks').delete().eq('id',id).eq('agent_id',agent.id)
  return NextResponse.json(error?{error:error.message}:{ok:true},{status:error?500:200})
}
