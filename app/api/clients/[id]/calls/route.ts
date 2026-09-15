import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callOutcomeSchema } from '@/lib/validators'

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params
  const parsed=callOutcomeSchema.safeParse(await request.json())
  if(!parsed.success)return NextResponse.json({error:'Résultat invalide'},{status:400})
  const supabase=await createClient()
  const {data:auth}=await supabase.auth.getUser()
  if(!auth.user)return NextResponse.json({error:'Connexion requise'},{status:401})
  const {data,error}=await supabase.rpc('complete_agent_call',{p_client_id:id,p_result_id:parsed.data.resultId,p_duration_seconds:parsed.data.durationSeconds,p_summary:parsed.data.summary||''})
  if(error)return NextResponse.json({error:error.message},{status:409})
  if(parsed.data.scheduledFor){
    const {data:agent}=await supabase.from('agents').select('id').eq('user_id',auth.user.id).eq('active',true).maybeSingle()
    const date=new Date(parsed.data.scheduledFor)
    if(!agent||Number.isNaN(date.getTime()))return NextResponse.json({error:'Appel enregistré, mais rappel invalide.'},{status:400})
    const {error:callbackError}=await supabase.from('callbacks').insert({agent_id:agent.id,client_id:id,title:'Rappel client',note:parsed.data.summary||'',scheduled_for:date.toISOString()})
    if(callbackError)return NextResponse.json({error:`Appel enregistré, mais rappel non créé : ${callbackError.message}`},{status:409})
  }
  return NextResponse.json({id:data},{status:201})
}
