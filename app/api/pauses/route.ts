import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { algiersDayRange } from '@/lib/dates'

async function currentAgent(){const supabase=await createClient();const {data:auth}=await supabase.auth.getUser();if(!auth.user)return {supabase,agent:null};const {data:agent}=await supabase.from('agents').select('id,active').eq('user_id',auth.user.id).maybeSingle();return {supabase,agent:agent?.active?agent:null}}

export async function GET(){
  const {supabase,agent}=await currentAgent()
  if(!agent)return NextResponse.json({error:'Compte agent actif requis'},{status:403})
  const day=algiersDayRange()
  const {data,error}=await supabase.from('pause_sessions').select('id,pause_type,started_at,ended_at').eq('agent_id',agent.id).gte('started_at',day.start).lt('started_at',day.end).order('started_at',{ascending:false})
  if(error)return NextResponse.json({error:error.message},{status:500})
  const rows=data??[]
  const completedSeconds=rows.filter(row=>row.ended_at).reduce((total,row)=>total+Math.max(0,Math.floor((new Date(row.ended_at!).getTime()-new Date(row.started_at).getTime())/1000)),0)
  return NextResponse.json({serverNow:new Date().toISOString(),open:rows.find(row=>!row.ended_at)??null,completedSeconds},{headers:{'Cache-Control':'no-store, max-age=0'}})
}

export async function POST(request:Request){const {supabase,agent}=await currentAgent();if(!agent)return NextResponse.json({error:'Compte agent actif requis'},{status:403});const input=await request.json() as {type?:'coffee'|'lunch'};if(!['coffee','lunch'].includes(input.type||''))return NextResponse.json({error:'Type de pause invalide'},{status:400});const {data:open}=await supabase.from('pause_sessions').select('id').eq('agent_id',agent.id).is('ended_at',null).maybeSingle();if(open)return NextResponse.json({error:'Une pause est déjà en cours'},{status:409});const {data,error}=await supabase.from('pause_sessions').insert({agent_id:agent.id,pause_type:input.type}).select().single();return NextResponse.json(error?{error:error.message}:data,{status:error?500:201})}

export async function PATCH(){const {supabase,agent}=await currentAgent();if(!agent)return NextResponse.json({error:'Compte agent actif requis'},{status:403});const {data:open}=await supabase.from('pause_sessions').select('id').eq('agent_id',agent.id).is('ended_at',null).maybeSingle();if(!open)return NextResponse.json({error:'Aucune pause en cours'},{status:404});const {error}=await supabase.from('pause_sessions').update({ended_at:new Date().toISOString()}).eq('id',open.id).is('ended_at',null);return NextResponse.json(error?{error:error.message}:{ok:true},{status:error?500:200})}
