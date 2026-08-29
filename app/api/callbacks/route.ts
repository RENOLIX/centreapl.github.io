import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request:Request){
  const supabase=await createClient()
  const {data:auth}=await supabase.auth.getUser()
  if(!auth.user)return NextResponse.json({error:'Non authentifié'},{status:401})
  const {data:agent}=await supabase.from('agents').select('id').eq('user_id',auth.user.id).eq('active',true).maybeSingle()
  if(!agent)return NextResponse.json({error:'Compte agent actif requis'},{status:403})
  const input=await request.json() as {title?:string;note?:string;scheduledFor?:string;clientId?:string|null}
  const title=input.title?.trim()||'';const note=input.note?.trim()||'';const date=new Date(input.scheduledFor||'')
  if(!title||title.length>120)return NextResponse.json({error:'Titre requis (120 caractères maximum)'},{status:400})
  if(note.length>1000||Number.isNaN(date.getTime()))return NextResponse.json({error:'Rappel invalide'},{status:400})
  const clientId=input.clientId||null
  if(clientId){
    if(!UUID.test(clientId))return NextResponse.json({error:'Client invalide'},{status:400})
    const {data:assignment}=await supabase.from('client_assignments').select('id').eq('agent_id',agent.id).eq('client_id',clientId).eq('status','active').maybeSingle()
    if(!assignment)return NextResponse.json({error:'Ce client ne vous est pas attribué'},{status:403})
  }
  const {data,error}=await supabase.from('callbacks').insert({agent_id:agent.id,client_id:clientId,title,note,scheduled_for:date.toISOString()}).select('id').single()
  return NextResponse.json(error?{error:error.message}:data,{status:error?500:201})
}
